# Workflow

- Prefers to test web app deliverables manually in a browser: after building, spin up a local dev server and share the URL rather than relying only on automated verification. Confidence: 0.7
- When the user reports a bug, they expect the fix to be verified empirically, not just reasoned about: confirm correctness quantitatively (e.g., statistical checks over hundreds of trials, real-browser DOM/computed-style assertions), because they have caught wrong assumptions before. Confidence: 0.65
- Prefers to enumerate feedback first and have the assistant track it in a task list, explicitly instructing the assistant NOT to start implementation until given the go-ahead. Confidence: 0.8
- Reports bugs as concrete observed-vs-expected pairs with exact numbers (e.g., "I see 3 on the dice and it says 4; I see 2 and it says 5"), often giving two examples per report, and expects issues to be reproduced precisely rather than described vaguely. Confidence: 0.6
- When handing over a batch of bug reports, expects the assistant to group them by common root cause ("there are common themes") and fix the underlying themes systematically rather than addressing each symptom as an isolated one-off. Confidence: 0.6
