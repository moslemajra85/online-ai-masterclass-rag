# Contributing

Thank you for helping improve the Online AI Masterclass created by Moslem Ajra.

## Development workflow

1. Create a focused branch.
2. Keep workshop explanations plain-language first and technically precise.
3. Never commit API keys, `.env`, generated virtual environments, or participant data.
4. Run the relevant verification before opening a pull request.

```bash
npm ci
npm run build

cd workshops/workshop-01-rag-foundations
python -m pip install -e ".[dev]"
python -m pytest -q
```

For UI changes, verify Guided Lessons, Diagram Lab, and Workshop 01 at both desktop
and narrow viewport sizes. For Python changes, add or update tests that demonstrate
the changed behavior.
