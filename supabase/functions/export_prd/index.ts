import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Answer {
  id: string;
  content: any;
  status: string;
  updated_at: string;
  question: {
    id: string;
    prompt: string;
    order_idx: number;
  };
}

interface Section {
  id: string;
  title: string;
  description: string;
  order_idx: number;
  questions: Array<{
    id: string;
    prompt: string;
    order_idx: number;
    answers: Answer[];
  }>;
}

// Convert TipTap JSON to Markdown
function convertTipTapToMarkdown(content: any): string {
  if (!content || typeof content !== 'object') return '';
  
  const convertNode = (node: any): string => {
    if (!node) return '';
    
    switch (node.type) {
      case 'doc':
        return (node.content || []).map(convertNode).join('\n\n');
      
      case 'paragraph':
        const text = (node.content || []).map(convertNode).join('');
        return text || '';
      
      case 'text':
        let text_content = node.text || '';
        
        // Apply marks
        if (node.marks) {
          for (const mark of node.marks) {
            switch (mark.type) {
              case 'bold':
                text_content = `**${text_content}**`;
                break;
              case 'italic':
                text_content = `*${text_content}*`;
                break;
              case 'code':
                text_content = `\`${text_content}\``;
                break;
              case 'link':
                text_content = `[${text_content}](${mark.attrs?.href || ''})`;
                break;
            }
          }
        }
        return text_content;
      
      case 'bulletList':
        return (node.content || []).map((item: any, index: number) => 
          `- ${convertNode(item)}`
        ).join('\n');
      
      case 'orderedList':
        return (node.content || []).map((item: any, index: number) => 
          `${index + 1}. ${convertNode(item)}`
        ).join('\n');
      
      case 'listItem':
        return (node.content || []).map(convertNode).join('');
      
      case 'hardBreak':
        return '\n';
      
      case 'heading':
        const level = node.attrs?.level || 1;
        const headingText = (node.content || []).map(convertNode).join('');
        return '#'.repeat(level) + ' ' + headingText;
      
      case 'blockquote':
        const quoteText = (node.content || []).map(convertNode).join('\n');
        return quoteText.split('\n').map(line => `> ${line}`).join('\n');
      
      case 'codeBlock':
        const codeText = (node.content || []).map(convertNode).join('');
        const language = node.attrs?.language || '';
        return `\`\`\`${language}\n${codeText}\n\`\`\``;
      
      default:
        return (node.content || []).map(convertNode).join('');
    }
  };

  return convertNode(content);
}

// Generate Markdown export
function generateMarkdownExport(sections: Section[]): string {
  let markdown = '# AEP Blueprint Export\n\n';
  markdown += `Generated on: ${new Date().toISOString()}\n\n`;
  
  for (const section of sections) {
    markdown += `## ${section.title}\n\n`;
    if (section.description) {
      markdown += `${section.description}\n\n`;
    }
    
    for (const question of section.questions) {
      markdown += `### ${question.prompt}\n\n`;
      
      // Get the latest final answer
      const finalAnswer = question.answers.find(a => a.status === 'final');
      if (finalAnswer) {
        const answerMarkdown = convertTipTapToMarkdown(finalAnswer.content);
        markdown += `${answerMarkdown}\n\n`;
        markdown += `*Last updated: ${new Date(finalAnswer.updated_at).toLocaleDateString()}*\n\n`;
      } else {
        markdown += '*No final answer provided.*\n\n';
      }
    }
  }
  
  return markdown;
}

// Generate PDF using React PDF (simplified - would need proper React PDF setup)
async function generatePDFExport(sections: Section[]): Promise<Uint8Array> {
  // For this implementation, we'll create a simple text-based PDF
  // In a real implementation, you'd use @react-pdf/renderer with proper components
  
  const markdown = generateMarkdownExport(sections);
  
  // Simple text-to-PDF conversion (placeholder)
  // This would be replaced with proper @react-pdf/renderer implementation
  const encoder = new TextEncoder();
  return encoder.encode(markdown);
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'md';
    
    if (!['pdf', 'md'].includes(format)) {
      return new Response(
        JSON.stringify({ error: 'Invalid format. Use pdf or md.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Verify user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user is admin
    const userRole = user.user_metadata?.role || 'viewer';
    if (userRole !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch all sections with questions and answers
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select(`
        *,
        questions (
          id,
          prompt,
          order_idx,
          answers (
            id,
            content,
            status,
            updated_at
          )
        )
      `)
      .order('order_idx');

    if (sectionsError) {
      console.error('Error fetching sections:', sectionsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Sort questions within each section
    const sortedSections = sections.map(section => ({
      ...section,
      questions: (section.questions || []).sort((a, b) => a.order_idx - b.order_idx)
    }));

    if (format === 'md') {
      const markdown = generateMarkdownExport(sortedSections);
      
      return new Response(markdown, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="aep-blueprint-${new Date().toISOString().split('T')[0]}.md"`
        }
      });
    } else {
      // PDF format
      const pdfData = await generatePDFExport(sortedSections);
      
      return new Response(pdfData, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="aep-blueprint-${new Date().toISOString().split('T')[0]}.pdf"`
        }
      });
    }

  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})