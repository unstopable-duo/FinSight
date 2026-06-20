import fs from 'fs';

let gemini = fs.readFileSync('server/gemini.ts', 'utf-8');

gemini = gemini.replace(/args\./g, '(args as any).');
gemini = gemini.replace(/\{ user_id, \.\.\.args/g, '{ user_id, ...(args as any)');
gemini = gemini.replace(/args \?/g, '(args as any) ?');

gemini = gemini.replace(
`      response = await chat.sendMessage([{
        functionResponse: {
          name: actionResults[0].name,
          response: actionResults[0].callResult
        }
      }]);`,
`      response = await chat.sendMessage([{
        functionResponse: {
          name: actionResults[0].name || '',
          response: actionResults[0].callResult as any
        }
      } as any]);`
);
fs.writeFileSync('server/gemini.ts', gemini);
console.log('patched gemini.ts');
