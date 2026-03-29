#!/usr/bin/env node
// UserPromptSubmit hook — Auto-detects mode triggers from natural language.
//
// Scans user prompts for workflow keywords and injects routing suggestions.
// Inspired by oh-my-claudecode's keyword-detector.
//
// Guards against informational queries (e.g., "explain what debug means")
// by checking for intent markers before triggering.
//
// Does NOT auto-execute — injects context so the agent knows the right route.

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = (data.prompt || data.message || '').toLowerCase().trim();

    if (!prompt || prompt.length < 5) {
      process.exit(0);
    }

    // Skip informational/meta queries — user is asking ABOUT something, not requesting action
    const infoPatterns = [
      /^(what|how|why|explain|describe|tell me about|can you|does|is there)/,
      /\?$/,
      /^(show|list|display|print|read|check)\s/,
    ];
    const isInfoQuery = infoPatterns.some(p => p.test(prompt));

    // Keyword → route mapping
    const routes = [
      {
        keywords: [/\bdebug\b/, /\bbug\b/, /\bbroken\b/, /\bnot working\b/, /\bcrash/, /\bfailing\b/],
        route: '/flow:debug',
        label: 'debug workflow',
        actionOnly: true, // Only trigger on action prompts, not info queries
      },
      {
        keywords: [/\bswarm\b/, /\bparallel agents?\b/, /\bmulti.?agent\b/, /\bteam of agents?\b/],
        route: '/flow:smart-swarm',
        label: 'smart swarm orchestration',
        actionOnly: false, // "swarm" is specific enough to always suggest
      },
      {
        keywords: [/\bship\s?(it|this)?\b/, /\bpush\s?(it|this)?\b/, /\bcreate\s?(a\s)?pr\b/, /\bopen\s?(a\s)?pr\b/],
        route: '/ship',
        label: 'ship workflow',
        actionOnly: false,
      },
      {
        keywords: [/\bdream\b/, /\bconsolidate\s?memor/, /\bclean\s?(up\s)?memor/],
        route: '/dream',
        label: 'memory consolidation',
        actionOnly: false,
      },
      {
        keywords: [/\breview\s?(the\s)?(code|pr|pull)/,  /\bcode\s?review\b/],
        route: '/flow:review',
        label: 'code review',
        actionOnly: true,
      },
      {
        keywords: [/\bplan\s?(this|out|the)\b/, /\barchitect\b/, /\bdesign\s?(the\s)?system\b/],
        route: '/flow:plan',
        label: 'planning workflow',
        actionOnly: true,
      },
      {
        keywords: [/\bresearch\b/, /\binvestigate\b/, /\bexplore\s?(the\s)?code/],
        route: '/flow:discover',
        label: 'discovery workflow',
        actionOnly: true,
      },
      {
        keywords: [/\bdone\b/, /\bwrap\s?up\b/, /\bthat'?s?\s?(it|all)\b/],
        route: '/done',
        label: 'session end',
        actionOnly: false,
      },
    ];

    const matches = [];

    for (const route of routes) {
      // Skip action-only routes on info queries
      if (route.actionOnly && isInfoQuery) continue;

      const hit = route.keywords.some(kw => kw.test(prompt));
      if (hit) {
        matches.push(route);
      }
    }

    if (matches.length === 0) {
      process.exit(0);
    }

    // Take the first (highest priority) match
    const best = matches[0];
    const suggestion = `KEYWORD DETECTED: User prompt matches "${best.label}". ` +
      `Recommended route: \`${best.route}\`. ` +
      `Apply this routing if it aligns with the user's intent.`;

    const output = {
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext: suggestion
      }
    };
    process.stdout.write(JSON.stringify(output));

  } catch (e) {
    process.exit(0);
  }
});
