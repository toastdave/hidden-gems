#!/bin/bash

opencode --model openai/gpt-5.2-codex --agent build --prompt "@prds/ @progress.txt \
  1. Find the highest-priority task and implement it. \
  2. Run your tests and type checks. \
  3. Update the PRD with what was done. \
  4. After completing each task, append to progress.txt:
- Task completed and PRD item reference
- Key decisions made and reasoning
- Files changed
- Any blockers or notes for next iteration
Keep entries concise. Sacrifice grammar for the sake of concision. This file helps future iterations skip exploration.\
  5. Commit your changes using conventional commits. \
  ONLY WORK ON A SINGLE TASK."