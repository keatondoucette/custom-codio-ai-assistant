// Wrapping the whole extension in a JS function and calling it immediately 
// (ensures all global variables set in this extension cannot be referenced outside its scope)
(async function(codioIDE, window) {
  
  // Refer to Anthropic's guide on system prompts: https://docs.anthropic.com/claude/docs/system-prompts
  const systemPrompt = `You are a helpful assistant helping students style their code properly.

You will be provided with a brief assignment description in <assignment> as well as the code in <code>.

Carefully review the <code> and <assignment> and look for inproper style.
After looking for inproper style, then
- Explain why the style is incorrect, and provide possible fixes and solutions as code snippets in markdown format
- If relevant, mention any common misconceptions that may be contributing to the student's inproper style
- When referring to code in your explanation, use markdown syntax - wrap inline code with \` and
multiline code with \`\`\` `

  // register(id: unique button id, name: name of button visible in Coach, function: function to call when button is clicked) 
  codioIDE.coachBot.register("syntaxFix", "Explain any syntax errors", onButtonPress)

  async function onButtonPress(params) {
    // Function that automatically collects all available context 
    // returns the following object: {guidesPage, assignmentData, files, error}

    let context = await codioIDE.coachBot.getContext()
    console.log(context)

    let input

    try {
      input = context.files[0]
    } 
    catch (e) {
        if (e.message == "Cancelled") {
          codioIDE.coachBot.write("Please feel free to have any other error messages explained!")
          codioIDE.coachBot.showMenu()
          return
        }
    }
   
    console.log(input)
    const valPrompt = `<Instructions>

Please determine whether the following text appears to have style errors:

<text>
${input}
</text>

Output your final Yes or No answer in JSON format with the key 'answer'

Focus on looking for anything in the code that appears to be not styled correctly. Do not look for logic errors.

- Two tabs for an indent instead of one

- An else on the same line as the closing if bracket }

- An open bracket { on a new line

- No spaces in between arithmetic operators

- Single lines of code being over 30 characters

- Comments are not useful

- Lack of comments on complicated parts of code

- Method is too long

- Variable name is not camelCase or UPPER_SNAKE_CASE

- Syntax errors such as a missing comma, closing bracket ) or }

If you don't see clear, with over 90% certainty, that this code has improper style, assume it does not not. Only answer "Yes" if you are quite 
confident it has style errors.

</Instructions>"`

    const validation_result = await codioIDE.coachBot.ask({
        systemPrompt: "You are a helpful assistant.",
        userPrompt: valPrompt
    }, {stream:false, preventMenu: true})

    if (validation_result.result.includes("Yes")) {
        //Define your assistant's userPrompt - this is where you will provide all the context you collected along with the task you want the LLM to generate text for.
        const userPrompt = `Here is the current code:

<current_code>
${input}
</current_code>
 Here is the description of the programming assignment the student is working on:

<assignment>
${context.guidesPage.content}
</assignment>

Here is the list of guidelines:

<guidelines>
- Two tabs for an indent instead of one

- An else on the same line as the closing if bracket }

- An open bracket { on a new line

- No spaces in between arithmetic operators

- Single lines of code being over 30 characters

- Comments are not useful

- Lack of comments on complicated parts of code

- Method is too long

- Variable name is not camelCase or UPPER_SNAKE_CASE

- Syntax errors such as a missing comma, closing bracket ) or }
</guidelines> 

If <assignment> and <current_code> are empty, assume that they're not available and respond with an error.
With the available context, follow the guidelines and respond with either the why the style in incorrect.

If generating your own explanation, make sure it is not longer than 2-3 sentences. 
The explanation should only describe what is wrong with the style and what rule it breaks.`

      const result = await codioIDE.coachBot.ask({
        systemPrompt: systemPrompt,
        messages: [{"role": "user", "content": userPrompt}]
      })
    }
    else {
        codioIDE.coachBot.write("This code doesn't have any style errors.")
        codioIDE.coachBot.showMenu()
    }
  }

})(window.codioIDE, window)