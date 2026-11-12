/* eslint-disable @typescript-eslint/no-var-requires */
// This is a plain CommonJS script, so require() is the correct way to load
// the fs module.

/**
 * README generator for the $functions, run with `npm run genmd`.
 *
 * It scans src/functions (grouped as category/subcategory, e.g.
 * discord/message/$sendmessage.ts), collects every function file (files
 * whose name starts with "$"), and writes three README.md files with
 * Mermaid graphs of the directory structure:
 * - src/functions/README.md (all categories)
 * - src/functions/discord/README.md (the discord functions)
 * - src/functions/js/README.md (the plain-JS functions)
 *
 * The generated Markdown must stay in sync with the directory layout, so
 * re-run this script after adding, moving, or removing a $function.
 */
const fs = require( "fs" );

const functionsDirectory = process.cwd() + "/src/functions";

const categories = fs.readdirSync( functionsDirectory, { withFileTypes: true } ).filter( x => x.isDirectory() ).map( x => x.name );

const functionsByCategory = {};
for ( const category of categories )
{
    const subcategories = fs.readdirSync( functionsDirectory + "/" + category, { withFileTypes: true } ).filter( x => x.isDirectory() ).map( x => x.name );
    const functionsBySubcategory = {};
    for ( const subcategory of subcategories )
    {
        const functionNames = fs.readdirSync( functionsDirectory + "/" + category + "/" + subcategory, { withFileTypes: true } ).filter( x => x.isFile() && x.name.startsWith( "$" ) ).map( x => x.name.split( "." )[ 0 ] );
        if ( functionNames.length )
            functionsBySubcategory[ subcategory ] = functionNames;
    }
    functionsByCategory[ category ] = functionsBySubcategory;
}
console.log( functionsByCategory );

const readme = `# Functions

## Directory Structure
\`\`\`mermaid
graph RL;
${ Object.keys( functionsByCategory ).map( x => `${ x } --> Functions` ).join( ";\n" )};
${ Object.keys( functionsByCategory ).map( x => Object.keys( functionsByCategory[ x ] ).map( y => `${ y } --> ${ x }` ).join( ";\n" ) ).join( ";\n" )};
\`\`\`

## Divisions

${ Object.keys( functionsByCategory ).map( x => ` - \`${ x }\`: Contains functions related to ${ x }` ).join( "\n" )}
`;

fs.writeFileSync( functionsDirectory + "/README.md", readme );

const discordReadme = `# Discord

## Directory Structure

\`\`\`mermaid
graph RL;
${ Object.keys( functionsByCategory[ "discord" ] ).map( x => functionsByCategory[ "discord" ][ x ].map( y => `${ y } --> ${ x }` ).join( ";\n" ) ).join( ";\n" ) };

\`\`\`

## Divisions

${ Object.keys( functionsByCategory[ "discord" ] ).map( x => ` - \`${ x }\`: Contains functions related to ${ x }` ).join( "\n" )}
`;

fs.writeFileSync( functionsDirectory + "/discord/README.md", discordReadme );

const jsReadme = `# JavaScript

## Directory Structure

\`\`\`mermaid
graph RL;
${ Object.keys( functionsByCategory[ "js" ] ).map( x => functionsByCategory[ "js" ][ x ].map( y => `${ y } --> ${ x }` ).join( ";\n" ) ).join( ";\n" ) };

\`\`\`

## Divisions

${ Object.keys( functionsByCategory[ "js" ] ).map( x => ` - \`${ x }\`: Contains functions related to ${ x }` ).join( "\n" )};
`;

fs.writeFileSync( functionsDirectory + "/js/README.md", jsReadme );