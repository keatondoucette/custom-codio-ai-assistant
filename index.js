(async function(codioIDE, window) {
  const coachAPI = codioIDE.coachBot;

  // === Register the Main Menu Button ===
  coachAPI.register("dalCodingAssistantMenu", "AI Coding Assistant Menu", async function() {
    coachAPI.showButton("📋 Summarize what I need to do", summarizeTask);
    coachAPI.showButton("💡 Provide a hint on what to do next", provideHint);
    coachAPI.showButton("🧯 Explain an error", explainError);
    coachAPI.showButton("🧹 Improve the quality of my code", syntaxFix);
  });

  // === Summarizer using Guide Page content ===
  async function summarizeTask() {
    // collects all available context
    const context = await coachAPI.getContext();
    console.log(`context -> `, context)
    // collects all page content
    const guideContent = context.guidesPage?.content || "No guide page content available.";
    console.log(`guide content -> `, guideContent)

    // System prompt for the summarizer
    const systemPrompt = `You are an assistant helping first-year students understand their Java programming assignments.

    Your job is to:
    - Read the assignment carefully.
    - Provide a short, beginner-friendly summary of what the student is being asked to do (1–2 sentences).
    - List the specific requirements the student must meet — especially those needed to pass test cases.

    Assume the student is new to programming, so keep your language clear and non-technical.

    Respond with:
    Summary: <short summary here>
    Requirements: <bulleted list of must-do items>

    Do NOT:
    - Include any code
    - Provide solutions
    - Use XML tags
    - Ask follow-up questions

    If the assignment content is missing or unclear, respond with:
    Nothing to summarize.`;

    // User prompt for the summarizer
    const userPrompt = `Here are the instructions for the assignment:

<assignment>
${guideContent}
</assignment>

Phrase your explanation directly addressing the student as 'you'.`;

    await coachAPI.ask({
      systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    });
  }

  // === Hint Generator ===
  async function provideHint() {
    // collects all available context
    const context = await coachAPI.getContext();
    console.log(`context -> `, context)

    // collects all available student code
    const code = context.files?.[0].content || "No source code content available.";
    console.log(`code content -> `, code)

    const systemPrompt = `You are an assistant helping students understand and make progress themselves on their programming assignments.
You will be provided with the Java code they're working in.
Based on this information, provide at most 2 relevant hints or ideas for things they can try next to make progress.
Do not provide the full solution.
Do not ask if they have any other questions.`;

    const userPrompt = `Here is the student's code:
<code>
${JSON.stringify(code)}
</code>
Phrase your hints directly addressing the student as 'you'.
Phrase your hints as questions or suggestions.`;

    await coachAPI.ask({
      systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    });
  }

  // === Error Explanation ===
  async function explainError(params) {
    // collects all available context
    const context = await coachAPI.getContext();
    console.log(`context -> `, context)

    // collects all available student code
    const code = context.files?.[0].content || "No source code content available.";
    console.log(`code content -> `, code)

    // collects all error information
    let input;
    if (params === "tooltip") {
      input = context.error.text;
      coachAPI.write(input, coachAPI.MESSAGE_ROLES.USER);
    } else {
      try {
        input = await coachAPI.input("Please paste the error message you want me to explain!");
      } catch (e) {
        if (e.message === "Cancelled") {
          coachAPI.write("Feel free to ask me to explain other errors!");
          coachAPI.showMenu();
          return;
        }
      }
    }

    const validationPrompt = `<Instructions>
Please determine whether the following text appears to be a programming error message or not:
<text>
${input}
</text>
Output your final Yes or No answer in JSON format with the key 'answer'.
</Instructions>`;

    const validation = await coachAPI.ask({
      systemPrompt: "You are a helpful assistant.",
      userPrompt: validationPrompt
    }, { stream: false, preventMenu: true });

    if (validation.result.includes("Yes")) {
      const systemPrompt = `You will be given a programming error message. Your task is to explain in plain, non-technical English what is causing the error, without suggesting any potential fixes or solutions.
If provided with the student's Java code, please carefully review it before explaining the error message.
Include common misconceptions. Use markdown formatting for code.`;

      const userPrompt = `Here is the error message:
<error_message>
${input}
</error_message>

Here is the student's Java code:
<code>
${JSON.stringify(code)}
</code>
Phrase your explanation directly addressing the student as 'you'.`;

      await coachAPI.ask({
        systemPrompt,
        messages: [{ role: "user", content: userPrompt }]
      });
    } else {
      coachAPI.write("This doesn't appear to be a recognizable error message.");
      coachAPI.showMenu();
    }
  }

  // === Code Quality Improvements ===
  async function syntaxFix() {
    // collects all available context
    const context = await coachAPI.getContext();
    console.log(`context -> `, context)

    // collects all available student code
    const code = context.files?.[0].content || "No source code content available.";
    console.log(`code content -> `, code)

    // System prompt for the styling checker
    const systemPrompt = `You are an assistant helping students style their code properly.
    You will be provided with the Java code they're working in.
    Based on this information, carefully review the code and look for improper style.
    After looking for inproper style, then
    - Explain why the style is incorrect, and provide possible fixes and solutions as code snippets in markdown format
    - If relevant, mention any common misconceptions that may be contributing to the student's inproper style

    Do not provide the full solution.
    Do not ask if they have any other questions.`;

    // User prompt for the styling checker
    const userPrompt = `Here is the student's code:
    <code>
    ${JSON.stringify(code)}
    </code>

    Perform the following checks:
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

    Phrase your revisions directly addressing the student as 'you'.
    Phrase your revisions as questions or suggestions.`;

    await coachAPI.ask({
          systemPrompt,
          messages: [{ role: "user", content: userPrompt }]
        });
  }

  // === Tooltip-triggered error help ===
  codioIDE.onErrorState((isError, error) => {
    if (isError) {
      coachAPI.showTooltip("I can help explain this error...", () => {
        coachAPI.open({ id: "customErrorTooltip", params: "tooltip" });
      });
    }
  });

  coachAPI.register("customErrorTooltip", "", explainError);

})(window.codioIDE, window);
