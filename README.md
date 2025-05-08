# custom-assistant-example-error-augmentation
This assistant example is designed to explain student programming error messages.

This assistant can be provided with custom teacher written explanations as well.
It will first check if the student's error message matches with any of the errors for which a teacher written augment is available.
If a match is found, it displays that explanation. If a match is not found, it requests the LLM to generate an explanation.

Tweak the `systemPrompt` or `userPrompt` to change/edit/update custom explanations or if you'd prefer a certain style of explanation. 
for eg. with or without code snippets, with or without potential fixes and/or misconceptions, etc.
