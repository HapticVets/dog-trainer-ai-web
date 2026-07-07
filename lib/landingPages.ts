import type { Metadata } from "next";

export type LandingPageConfig = {
  slug: "puppy-training" | "stop-barking" | "leash-training" | "german-shepherd-training";
  title: string;
  description: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroImage?: {
    src: string;
    alt: string;
    width: number;
    height: number;
    caption?: string;
  };
  supportingSection?: {
    eyebrow: string;
    title: string;
    body: string[];
    image: {
      src: string;
      alt: string;
      width: number;
      height: number;
      caption?: string;
    };
  };
  problemTitle: string;
  problemSummary: string;
  focusAreas: string[];
  commonMistakes: string[];
  aiHelps: string[];
  examplePlan: {
    objective: string;
    setup: string;
    workingReps: string;
    successCriteria: string;
    nextStep: string;
  };
  askTheAi: string[];
  faq: Array<{ question: string; answer: string }>;
  relatedPages: Array<{
    href: "/puppy-training" | "/stop-barking" | "/leash-training" | "/german-shepherd-training";
    label: string;
  }>;
};

export const landingPages: Record<LandingPageConfig["slug"], LandingPageConfig> = {
  "puppy-training": {
    slug: "puppy-training",
    title: "Puppy Training Plans Built Around Your Puppy",
    description:
      "Get structured AI puppy training guidance for biting, crate training, potty training, socialization, and home structure.",
    heroHeadline: "Puppy Training Plans Built Around Your Puppy",
    heroSubheadline:
      "Get structured puppy guidance for biting, crate training, potty training, socialization, basic obedience, and home structure built from Patriot K9 Command doctrine.",
    supportingSection: {
      eyebrow: "Early Confidence Matters",
      title: "Puppy development starts with calm exposure and clean structure",
      body: [
        "Good puppy work is not just about teaching commands. It is about building confidence through everyday structure, calm travel, and controlled exposure to new environments.",
        "When a puppy learns to settle, observe, and move through normal experiences without chaos, socialization becomes cleaner and future training has a stronger foundation.",
      ],
      image: {
        src: "/images/puppies/patriot-k9-puppy-training-travel.jpg",
        alt: "German Shepherd puppy calmly riding in a vehicle during Patriot K9 puppy training.",
        width: 2160,
        height: 2880,
        caption:
          "Confidence starts with everyday experiences like calm, structured travel.",
      },
    },
    problemTitle: "Puppy problems get harder when structure is inconsistent",
    problemSummary:
      "Most puppy problems are not random. Biting, crate resistance, accidents in the house, and chaos around routines usually come from unclear structure, low consistency, and too much freedom too early.",
    focusAreas: [
      "Puppy biting",
      "Crate training",
      "Potty training",
      "Socialization",
      "Basic obedience",
      "Structure at home",
    ],
    commonMistakes: [
      "Giving the puppy too much freedom before routines are stable",
      "Using inconsistent crate rules and potty timing",
      "Treating biting like a personality issue instead of a structure problem",
      "Flooding the puppy with stimulation instead of controlled exposure",
    ],
    aiHelps: [
      "Build a puppy schedule around age, energy, and household setup",
      "Turn biting and over-arousal into a clear management plan",
      "Map crate conditioning and potty progress step by step",
      "Show what to train first so obedience starts clean instead of messy",
    ],
    examplePlan: {
      objective: "Reduce puppy biting and improve calm crate entry.",
      setup: "Use leash guidance, food rewards, short crate reps, and a quiet home zone.",
      workingReps: "Run 6 to 8 short reps of crate entry, release, and calm reset between bitey periods.",
      successCriteria: "Puppy enters crate without resistance and redirects onto the handler's routine instead of biting.",
      nextStep: "Add duration in crate and cleaner transitions into rest after exercise.",
    },
    askTheAi: [
      "How do I stop puppy biting in the evening?",
      "What crate routine should I use for an 11-week-old puppy?",
      "How often should I take my puppy out for potty training?",
      "What should I focus on before formal obedience?",
    ],
    faq: [
      {
        question: "Can the AI help with housebreaking?",
        answer:
          "Yes. It can build a potty schedule, crate routine, and management plan based on your puppy's age and current accident pattern.",
      },
      {
        question: "Does this replace puppy classes?",
        answer:
          "No. It gives structured guidance and progression support, but in-person help can still be useful when a puppy needs hands-on evaluation.",
      },
    ],
    relatedPages: [
      { href: "/leash-training", label: "Leash training help" },
      { href: "/stop-barking", label: "Barking help" },
      { href: "/german-shepherd-training", label: "German Shepherd training" },
    ],
  },
  "stop-barking": {
    slug: "stop-barking",
    title: "Stop Barking With a Structured Training Plan",
    description:
      "Use Patriot K9 AI Trainer to troubleshoot door barking, crate barking, barking at people or dogs, and build calm behavior.",
    heroHeadline: "Stop Barking With a Structured Training Plan",
    heroSubheadline:
      "Get structured help for door barking, alert barking, barking at people, barking at dogs, crate barking, and building calm behavior.",
    problemTitle: "Barking usually gets worse when owners only react to the noise",
    problemSummary:
      "Barking is often tied to threshold pressure, unclear leadership, poor neutrality, and a dog that has rehearsed the same reaction pattern too many times. Shouting over it rarely fixes the cause.",
    focusAreas: [
      "Door barking",
      "Alert barking",
      "Barking at people",
      "Barking at dogs",
      "Crate barking",
      "Teaching calm behavior",
    ],
    commonMistakes: [
      "Yelling after the dog is already escalated",
      "Correcting the noise without changing the trigger picture",
      "Letting the dog rehearse barking at doors, windows, and crates all day",
      "Skipping calm place work and threshold management",
    ],
    aiHelps: [
      "Break barking into trigger, threshold, and handling errors",
      "Build a calm routine around doors, visitors, and crates",
      "Show when to use place work, management, and controlled exposure",
      "Give owners a repeatable plan instead of random corrections",
    ],
    examplePlan: {
      objective: "Reduce barking at the front door and create calm on place.",
      setup: "Use place bed, leash, controlled door sound reps, and quiet resets between exposures.",
      workingReps: "Run 5 controlled door triggers with immediate redirection back to place and calm reward timing.",
      successCriteria: "Dog stays on place with reduced vocalization and recovers quickly after door movement.",
      nextStep: "Increase realism with actual visitor movement once calm responses become repeatable.",
    },
    askTheAi: [
      "How do I stop barking when someone knocks?",
      "What should I do about crate barking at night?",
      "How do I handle barking at people on walks?",
      "When should I use place for barking problems?",
    ],
    faq: [
      {
        question: "Can barking be fixed without seeing the dog in person?",
        answer:
          "Many barking issues can improve with structure, management, and clean training progressions. Serious aggression, bite risk, or unsafe reactions still need in-person help.",
      },
      {
        question: "Will this help with barking at dogs outside?",
        answer:
          "Yes. The AI can build a controlled exposure and neutrality plan around barking at dogs, distance thresholds, and handler timing.",
      },
    ],
    relatedPages: [
      { href: "/leash-training", label: "Leash training help" },
      { href: "/puppy-training", label: "Puppy training help" },
      { href: "/german-shepherd-training", label: "German Shepherd training" },
    ],
  },
  "leash-training": {
    slug: "leash-training",
    title: "Teach Your Dog to Walk Without Pulling",
    description:
      "Structured leash training help for pulling, loose leash walking, heel foundations, engagement, walk structure, and leash reactivity.",
    heroHeadline: "Teach Your Dog to Walk Without Pulling",
    heroSubheadline:
      "Get structured AI guidance for pulling on leash, loose leash walking, heel foundations, engagement, walk structure, and leash-based reactivity.",
    problemTitle: "Leash pulling usually reflects poor communication, not just excitement",
    problemSummary:
      "When a dog drags on walks, forges ahead, or reacts through the leash, the issue is usually a combination of weak engagement, unclear leash communication, and no structured walking standard.",
    focusAreas: [
      "Pulling on leash",
      "Loose leash walking",
      "Heel foundations",
      "Engagement",
      "Walk structure",
      "Reactivity on leash",
    ],
    commonMistakes: [
      "Letting the dog rehearse pulling for the entire walk",
      "Trying to out-walk the problem instead of resetting structure",
      "Correcting without first teaching clear leash communication",
      "Moving into distractions before the dog can stay engaged in easy settings",
    ],
    aiHelps: [
      "Build heel and loose-leash work from clear foundation reps",
      "Show how to structure a walk instead of just surviving one",
      "Break down leash pressure, resets, and reward timing",
      "Troubleshoot pulling and leash reactivity with progression logic",
    ],
    examplePlan: {
      objective: "Stop pulling and improve clean engagement at the start of walks.",
      setup: "Use leash, low-distraction environment, reward marker, and short walking lanes.",
      workingReps: "Run 8 to 10 short heel starts with resets any time the dog forges or disconnects.",
      successCriteria: "Dog stays with the handler for short controlled stretches without leash tension.",
      nextStep: "Add mild environmental distractions once engagement and position stay repeatable.",
    },
    askTheAi: [
      "How do I stop my dog from pulling on every walk?",
      "Should I work heel or loose leash walking first?",
      "How do I handle leash reactivity without making it worse?",
      "What does a structured walk look like?",
    ],
    faq: [
      {
        question: "Can this help if my dog only pulls outside?",
        answer:
          "Yes. The AI can build a progression that starts where the dog can still learn, then moves back toward outdoor distractions with structure.",
      },
      {
        question: "Does leash training help with reactivity too?",
        answer:
          "Often yes. Clean leash communication, engagement, and better walk structure are usually part of reactivity foundation work.",
      },
    ],
    relatedPages: [
      { href: "/stop-barking", label: "Barking help" },
      { href: "/puppy-training", label: "Puppy training help" },
      { href: "/german-shepherd-training", label: "German Shepherd training" },
    ],
  },
  "german-shepherd-training": {
    slug: "german-shepherd-training",
    title: "German Shepherd Training Built for Drive, Structure, and Control",
    description:
      "AI dog training built for German Shepherds with drive management, obedience, leash work, recall, reactivity foundations, and handler leadership.",
    heroHeadline: "German Shepherd Training Built for Drive, Structure, and Control",
    heroSubheadline:
      "Get structured AI guidance for working-line energy, obedience, leash pulling, recall, reactivity, handler leadership, and drive control.",
    heroImage: {
      src: "/images/obedience/patriot-k9-german-shepherd-field-training.jpg",
      alt: "German Shepherds training outdoors with Patriot K9 Command.",
      width: 2880,
      height: 2160,
      caption:
        "Real Patriot K9 Command training dogs during structured obedience work.",
    },
    problemTitle: "High-drive German Shepherds need structure, not generic pet-dog advice",
    problemSummary:
      "German Shepherds often struggle when drive, responsibility, and structure are out of balance. Pulling, over-arousal, reactivity, and handler conflict usually improve when the dog gets cleaner standards and clearer leadership.",
    focusAreas: [
      "Working-line energy",
      "Obedience",
      "Leash pulling",
      "Recall",
      "Reactivity",
      "Handler leadership",
      "Drive control",
    ],
    commonMistakes: [
      "Treating a high-drive dog like a low-demand family pet",
      "Using too much stimulation without enough structure and recovery",
      "Skipping engagement and leadership before pushing challenge",
      "Confusing intensity for understanding",
    ],
    aiHelps: [
      "Build obedience progressions that match drive and handler skill",
      "Balance structure, reward, and control without flattening the dog",
      "Support recall, leash work, neutrality, and engagement from doctrine",
      "Give German Shepherd owners clear next steps for real home life",
    ],
    examplePlan: {
      objective: "Improve engagement and leash control for a high-drive German Shepherd.",
      setup: "Use short leash, marker system, structured heel lane, and controlled reward access.",
      workingReps: "Run 6 to 8 engagement starts followed by short heel sequences with immediate resets for forging or loss of focus.",
      successCriteria: "Dog re-engages quickly, stays connected, and shows cleaner leash control under moderate arousal.",
      nextStep: "Layer in recalls and public neutrality once foundation reps stay reliable.",
    },
    askTheAi: [
      "How do I handle a high-drive German Shepherd on walks?",
      "What should I focus on first with shepherd reactivity?",
      "How do I build recall without losing drive?",
      "What does handler leadership look like day to day?",
    ],
    faq: [
      {
        question: "Is this useful for working-line German Shepherds?",
        answer:
          "Yes. The platform is especially useful for owners who need more structure around drive, engagement, and control instead of generic advice.",
      },
      {
        question: "Can it help with obedience and behavior at the same time?",
        answer:
          "Yes. The AI can prioritize the main problem first while still building obedience, structure, and progression into the plan.",
      },
    ],
    relatedPages: [
      { href: "/leash-training", label: "Leash training help" },
      { href: "/stop-barking", label: "Barking help" },
      { href: "/puppy-training", label: "Puppy training help" },
    ],
  },
};

export const getLandingPageMetadata = (config: LandingPageConfig): Metadata => ({
  title: config.title,
  description: config.description,
  openGraph: {
    title: config.title,
    description: config.description,
    url: `https://train.hapticvets.com/${config.slug}`,
  },
  twitter: {
    title: config.title,
    description: config.description,
  },
});
