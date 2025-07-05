import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupDatabase() {
  console.log('🚀 Setting up database...')
  
  try {
    // Read migration files
    const migrationsDir = path.join(__dirname, 'supabase', 'migrations')
    const migrationFiles = [
      '0001_init.sql',
      '0002_sprint1_followups.sql', 
      '0003_views.sql',
      '0005_sprint3_admin.sql'
    ]

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file)
      if (fs.existsSync(filePath)) {
        console.log(`📄 Reading ${file}...`)
        const sql = fs.readFileSync(filePath, 'utf8')
        
        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(s => s.trim().length > 0)
        
        for (const statement of statements) {
          if (statement.trim()) {
            console.log(`🔄 Executing: ${statement.trim().substring(0, 50)}...`)
            try {
              const { error } = await supabase.rpc('exec_sql', { sql: statement.trim() + ';' })
              if (error) {
                console.log(`⚠️ Warning for statement: ${error.message}`)
              }
            } catch (err) {
              console.log(`⚠️ Error with statement: ${err}`)
            }
          }
        }
      }
    }

    // Create some sample data
    console.log('📝 Creating sample data...')
    
    const { data: sectionData, error: sectionError } = await supabase
      .from('sections')
      .insert([
        { title: 'Architecture & Design', description: 'System architecture and design decisions', order_idx: 1 },
        { title: 'Implementation', description: 'Technical implementation details', order_idx: 2 },
        { title: 'Testing & Quality', description: 'Testing strategies and quality assurance', order_idx: 3 }
      ])
      .select()

    if (sectionError) {
      console.log('Section creation error:', sectionError)
    } else {
      console.log('✅ Sections created!')
    }

    // Test the setup
    console.log('🧪 Testing database...')
    const { data: testData, error: testError } = await supabase
      .from('sections')
      .select('*')

    if (testError) {
      console.error('❌ Test failed:', testError)
    } else {
      console.log('✅ Database test successful!', testData)
    }

  } catch (error) {
    console.error('💥 Setup failed:', error)
  }
}

setupDatabase()