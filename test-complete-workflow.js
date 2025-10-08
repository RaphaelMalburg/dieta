const fs = require('fs');
const path = require('path');

console.log('🧪 COMPREHENSIVE PDF PARSING & COMPONENT RENDERING TEST');
console.log('=' .repeat(60));

// Test 1: Verify PDF file exists
console.log('\n📄 Test 1: PDF File Verification');
const pdfPath = path.join(__dirname, 'dieta.pdf');
if (fs.existsSync(pdfPath)) {
    const stats = fs.statSync(pdfPath);
    console.log('✅ PDF file exists:', pdfPath);
    console.log('📊 File size:', (stats.size / 1024).toFixed(2), 'KB');
} else {
    console.log('❌ PDF file NOT found:', pdfPath);
    process.exit(1);
}

// Test 2: Verify Service Worker Configuration
console.log('\n🔧 Test 2: Service Worker Configuration');
const swPath = path.join(__dirname, 'public', 'sw.js');
if (fs.existsSync(swPath)) {
    const swContent = fs.readFileSync(swPath, 'utf8');
    
    // Check for API exclusion
    if (swContent.includes('url.pathname.startsWith(\'/api/\')')) {
        console.log('✅ Service worker excludes API routes from caching');
    } else {
        console.log('❌ Service worker may interfere with API requests');
    }
    
    // Check for POST method handling
    if (swContent.includes('request.method !== \'GET\'')) {
        console.log('✅ Service worker skips non-GET requests');
    } else {
        console.log('❌ Service worker may interfere with POST requests');
    }
} else {
    console.log('❌ Service worker file not found');
}

// Test 3: Verify API Routes
console.log('\n🌐 Test 3: API Routes Verification');
const apiRoutes = [
    'src/app/api/pdf-upload/route.ts',
    'src/app/api/diet/route.ts',
    'src/app/api/auth/route.ts'
];

apiRoutes.forEach(route => {
    const routePath = path.join(__dirname, route);
    if (fs.existsSync(routePath)) {
        console.log('✅ API route exists:', route);
    } else {
        console.log('❌ API route missing:', route);
    }
});

// Test 4: Verify React Components
console.log('\n⚛️  Test 4: React Components Verification');
const components = [
    'src/components/DietPlanDisplay.tsx',
    'src/components/PDFUpload.tsx',
    'src/components/MealCard.tsx',
    'src/components/GeneralInfoCard.tsx',
    'src/components/RestrictionCard.tsx',
    'src/components/SubstitutionCard.tsx',
    'src/components/InstructionCard.tsx'
];

components.forEach(component => {
    const componentPath = path.join(__dirname, component);
    if (fs.existsSync(componentPath)) {
        console.log('✅ Component exists:', component);
        
        // Check for specific patterns in key components
        const content = fs.readFileSync(componentPath, 'utf8');
        
        if (component.includes('DietPlanDisplay')) {
            if (content.includes('JSON.parse')) {
                console.log('  ✅ Has JSON parsing logic');
            }
            if (content.includes('structuredData')) {
                console.log('  ✅ Handles structured data');
            }
            if (content.includes('MealCard')) {
                console.log('  ✅ Renders MealCard components');
            }
        }
        
        if (component.includes('PDFUpload')) {
            if (content.includes('FormData')) {
                console.log('  ✅ Uses FormData for file upload');
            }
            if (content.includes('/api/pdf-upload')) {
                console.log('  ✅ Calls correct API endpoint');
            }
        }
        
        if (component.includes('MealCard')) {
            if (content.includes('Collapsible')) {
                console.log('  ✅ Has collapsible functionality');
            }
            if (content.includes('opcoes')) {
                console.log('  ✅ Handles meal options');
            }
        }
    } else {
        console.log('❌ Component missing:', component);
    }
});

// Test 5: Verify Database Schema
console.log('\n🗄️  Test 5: Database Schema Verification');
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
if (fs.existsSync(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    console.log('✅ Prisma schema exists');
    
    if (schemaContent.includes('model DietPlan')) {
        console.log('  ✅ DietPlan model defined');
    }
    if (schemaContent.includes('model User')) {
        console.log('  ✅ User model defined');
    }
} else {
    console.log('❌ Prisma schema not found');
}

// Test 6: Environment Variables
console.log('\n🔐 Test 6: Environment Variables');
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    console.log('✅ Environment file exists');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('GOOGLE_AI_API_KEY')) {
        console.log('  ✅ Google AI API key configured');
    } else {
        console.log('  ❌ Google AI API key missing');
    }
    
    if (envContent.includes('DATABASE_URL')) {
        console.log('  ✅ Database URL configured');
    } else {
        console.log('  ❌ Database URL missing');
    }
} else {
    console.log('❌ Environment file not found');
}

console.log('\n🎯 MANUAL TESTING INSTRUCTIONS');
console.log('=' .repeat(60));
console.log('1. Open http://localhost:3000 in your browser');
console.log('2. Open browser DevTools (F12) and go to Console tab');
console.log('3. Upload the dieta.pdf file using the PDF upload component');
console.log('4. Select username "raphael" from the dropdown');
console.log('5. Click "Upload PDF" button');
console.log('');
console.log('📊 EXPECTED BEHAVIOR:');
console.log('- PDF should upload successfully without cache errors');
console.log('- Console should show debug logs from DietPlanDisplay component');
console.log('- Structured diet plan should render with beautiful cards');
console.log('- Meal cards should be collapsible with multiple options');
console.log('- General info, restrictions, substitutions should display');
console.log('');
console.log('🔍 EXPECTED CONSOLE OUTPUT:');
console.log('=== DietPlanDisplay Debug ===');
console.log('dietPlan received: [JSON string]');
console.log('dietPlan type: string');
console.log('Attempting to parse as JSON...');
console.log('JSON parsing successful!');
console.log('Parsed data: [structured object]');
console.log('Data has expected structure, rendering structured components');
console.log('Has informacoes_gerais: true');
console.log('Has refeicoes: true');
console.log('Refeicoes is array: true');
console.log('');
console.log('❌ IF YOU SEE THESE ERRORS, SOMETHING IS WRONG:');
console.log('- TypeError: Failed to fetch');
console.log('- Request method \'POST\' is unsupported');
console.log('- JSON parsing failed');
console.log('- Raw content (JSON parsing failed)');
console.log('');
console.log('✅ TEST COMPLETED - Ready for manual verification!');