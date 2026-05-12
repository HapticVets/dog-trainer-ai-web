export type PatriotK9Protocol = {
  title: string;
  purpose: string;
  corePrinciple: string;
  phases: string[];
  criticalTrainerNotes: string[];
  commonMistakes: string[];
  finalGoal: string;
};

export const patriotK9Protocols: PatriotK9Protocol[] = [
  {
    title: "Neutral Possession System",
    purpose:
      "Teach the dog to hold calm possession of food, toys, space, and reward access without frantic behavior.",
    corePrinciple:
      "Possession stays neutral until the handler releases value through structure and clarity.",
    phases: [
      "Establish calm possession with low-value items.",
      "Add handler movement, touch, and delayed release.",
      "Proof neutrality around higher-value rewards and transitions.",
    ],
    criticalTrainerNotes: [
      "Calm possession matters more than flashy drive early on.",
      "Release rewards from obedience, not from demand behavior.",
    ],
    commonMistakes: [
      "Rewarding grabbing, vocalizing, or frantic anticipation.",
      "Moving to high-value items before the dog can stay neutral on simple reps.",
    ],
    finalGoal:
      "The dog can hold value calmly and wait for clear handler direction before engaging it.",
  },
  {
    title: "Relationship Rehabilitation Protocol",
    purpose:
      "Repair conflict, confusion, or weak trust between dog and handler through predictable structure.",
    corePrinciple:
      "Relationship improves when the handler becomes clear, fair, and consistent under pressure.",
    phases: [
      "Remove chaotic interactions and reset daily structure.",
      "Rebuild trust through simple wins, markers, and follow-through.",
      "Add accountability only after clarity and predictability return.",
    ],
    criticalTrainerNotes: [
      "The handler must become less emotional and more readable.",
      "Small consistent reps beat dramatic corrections or affection swings.",
    ],
    commonMistakes: [
      "Trying to fix the relationship with affection alone.",
      "Correcting a dog that is still confused about criteria.",
    ],
    finalGoal:
      "The dog trusts the handler's guidance and responds without conflict or avoidance.",
  },
  {
    title: "Threshold Management Protocol",
    purpose:
      "Control arousal at doors, gates, crates, cars, and transition points where dogs commonly rush or break commands.",
    corePrinciple:
      "Thresholds are earned through calm control, not rushed through because the dog wants access.",
    phases: [
      "Create pause-and-wait behavior at low-pressure thresholds.",
      "Add duration, handler movement, and release timing.",
      "Proof thresholds under distraction and real-world urgency.",
    ],
    criticalTrainerNotes: [
      "Thresholds are structure points, not just obedience reps.",
      "The release cue should be as clear as the stop cue.",
    ],
    commonMistakes: [
      "Opening access while the dog is leaning, loading, or forging.",
      "Repeating commands instead of resetting the threshold rep.",
    ],
    finalGoal:
      "The dog waits calmly at transition points until released, regardless of excitement.",
  },
  {
    title: "Handler Leadership System",
    purpose:
      "Develop handler consistency, timing, and follow-through so the dog experiences stable leadership.",
    corePrinciple:
      "Leadership is shown through structure, direction, and accountability, not volume or intimidation.",
    phases: [
      "Clarify handler rules, routines, and reward timing.",
      "Build consistent command enforcement and neutral follow-through.",
      "Apply leadership in distractions, public settings, and conflict moments.",
    ],
    criticalTrainerNotes: [
      "Handlers must remove negotiation language and mixed signals.",
      "Fair accountability only works when the handler is readable.",
    ],
    commonMistakes: [
      "Becoming reactive when the dog makes a mistake.",
      "Allowing commands to become suggestions through inconsistency.",
    ],
    finalGoal:
      "The handler leads with calm authority and the dog follows clear structure without conflict.",
  },
  {
    title: "Structured Socialization Protocol",
    purpose:
      "Expose the dog to people, dogs, places, sounds, and surfaces in a controlled way that builds neutrality and confidence.",
    corePrinciple:
      "Socialization is controlled exposure with criteria, not random access to stimulation.",
    phases: [
      "Introduce low-pressure exposures with distance and handler support.",
      "Build duration, neutrality, and recovery around mild stressors.",
      "Generalize controlled behavior across varied environments and triggers.",
    ],
    criticalTrainerNotes: [
      "Exposure without control often rehearses the problem.",
      "Distance is a training tool, not a failure.",
    ],
    commonMistakes: [
      "Flooding the dog with too much stimulation too early.",
      "Confusing friendliness with productive socialization.",
    ],
    finalGoal:
      "The dog can move through new environments with composure, engagement, and clear handler focus.",
  },
  {
    title: "Crate Conditioning System",
    purpose:
      "Build calm, clean, and predictable crate behavior for rest, management, decompression, and boarding readiness.",
    corePrinciple:
      "The crate should become a neutral, structured off-switch rather than a place of conflict.",
    phases: [
      "Create positive entry and short calm duration inside the crate.",
      "Add realistic confinement time, release criteria, and household routine.",
      "Proof crate behavior during departures, arrivals, and high-arousal moments.",
    ],
    criticalTrainerNotes: [
      "Release calm, not noise.",
      "Crate work is part of daily structure, not just emergency management.",
    ],
    commonMistakes: [
      "Letting barking control the release timing.",
      "Using the crate only when the dog is already overstimulated.",
    ],
    finalGoal:
      "The dog enters, settles, and stays calm in the crate as part of a reliable routine.",
  },
  {
    title: "Engagement Development Protocol",
    purpose:
      "Increase the dog's desire to orient to the handler for information, reward, and direction.",
    corePrinciple:
      "Engagement grows when the handler becomes relevant, clear, and rewarding without begging for attention.",
    phases: [
      "Capture and reward orientation in low-distraction settings.",
      "Build sustained focus through movement, patterning, and release timing.",
      "Generalize engagement under distraction and working pressure.",
    ],
    criticalTrainerNotes: [
      "Engagement should be built before heavy proofing.",
      "Keep reps short enough to preserve clarity and intensity.",
    ],
    commonMistakes: [
      "Talking too much and turning engagement into nagging.",
      "Adding distractions before the dog understands how to reorient.",
    ],
    finalGoal:
      "The dog checks in quickly and stays mentally available to the handler across environments.",
  },
  {
    title: "Public Neutrality Protocol",
    purpose:
      "Teach the dog to remain composed, responsive, and non-reactive in public settings.",
    corePrinciple:
      "Neutrality means the environment is background noise unless the handler makes it relevant.",
    phases: [
      "Create neutral behavior in controlled low-stimulation public spaces.",
      "Layer duration, movement, and obedience around moderate distractions.",
      "Proof neutrality in busy real-world scenarios with clear recovery rules.",
    ],
    criticalTrainerNotes: [
      "Public work should expose holes, not hide them.",
      "If neutrality breaks, reduce challenge before advancing.",
    ],
    commonMistakes: [
      "Using public settings before indoor control is stable.",
      "Allowing strangers or dogs to interrupt criteria for the sake of social comfort.",
    ],
    finalGoal:
      "The dog can move through public environments calmly and remain handler-directed.",
  },
  {
    title: "Multi-Dog Household Protocol",
    purpose:
      "Create structure, fairness, and conflict prevention in homes with more than one dog.",
    corePrinciple:
      "Multi-dog peace comes from management, individual accountability, and clean resource control.",
    phases: [
      "Separate dogs during high-value moments and establish individual rules.",
      "Reintroduce shared routines with structured obedience and neutral spacing.",
      "Proof group stability during movement, thresholds, feeding, and rest periods.",
    ],
    criticalTrainerNotes: [
      "Each dog must understand commands separately before group expectations increase.",
      "Resource management prevents rehearsed conflict.",
    ],
    commonMistakes: [
      "Trying to fix inter-dog tension with freedom instead of structure.",
      "Ignoring subtle loading behavior until it escalates.",
    ],
    finalGoal:
      "Multiple dogs can live together with clear rules, stable management, and low conflict.",
  },
  {
    title: "Fear Rehabilitation Protocol",
    purpose:
      "Help fearful dogs build confidence and functional behavior without flooding or false reassurance.",
    corePrinciple:
      "Confidence grows through controlled success, not by forcing the dog through overwhelm.",
    phases: [
      "Stabilize the dog with distance, predictability, and simple wins.",
      "Introduce controlled exposure with clear exit and recovery structure.",
      "Expand confidence across contexts while preserving composure and handler trust.",
    ],
    criticalTrainerNotes: [
      "Do not confuse shutdown with progress.",
      "Recovery speed is a key metric, not just surface compliance.",
    ],
    commonMistakes: [
      "Flooding the dog to prove a point.",
      "Using too much comfort in a way that reinforces avoidance patterns.",
    ],
    finalGoal:
      "The dog can process mild to moderate stressors with stability, recovery, and handler trust.",
  },
  {
    title: "Reactivity Rehabilitation Protocol",
    purpose:
      "Reduce explosive responses to triggers by rebuilding clarity, neutrality, and control around trigger exposure.",
    corePrinciple:
      "Reactivity improves when the dog learns a replacement pattern before emotional load spikes.",
    phases: [
      "Find threshold distance and rebuild control away from trigger overload.",
      "Pattern neutral obedience and recovery around controlled trigger exposure.",
      "Generalize stable responses to varied triggers, distances, and environments.",
    ],
    criticalTrainerNotes: [
      "Distance and timing are major tools, not avoidance failures.",
      "Recovery after exposure matters as much as the exposure itself.",
    ],
    commonMistakes: [
      "Working too close to the trigger too early.",
      "Correcting chaos after the dog is already over threshold.",
    ],
    finalGoal:
      "The dog can notice triggers, stay within handler control, and recover quickly without an outburst.",
  },
  {
    title: "E-Collar Conditioning Protocol",
    purpose:
      "Condition the dog to understand e-collar pressure as clear communication layered on known behavior.",
    corePrinciple:
      "The e-collar clarifies and reinforces existing obedience; it does not replace teaching.",
    phases: [
      "Condition low-level pressure with known commands and clear escape routes.",
      "Build fluency through repetition, timing, and fair release mechanics.",
      "Generalize conditioned understanding into distance, distraction, and off-leash reliability.",
    ],
    criticalTrainerNotes: [
      "Only layer e-collar pressure onto behaviors the dog already understands.",
      "Level selection must preserve clarity, not create conflict or panic.",
    ],
    commonMistakes: [
      "Using the collar to punish confusion.",
      "Increasing levels to solve poor teaching or poor timing.",
    ],
    finalGoal:
      "The dog clearly understands e-collar pressure and responds calmly and reliably to known commands.",
  },
  {
    title: "Leash Pressure Communication System",
    purpose:
      "Teach the dog to understand leash pressure as guidance instead of something to fight or ignore.",
    corePrinciple:
      "Leash pressure should create informed movement toward relief, not opposition.",
    phases: [
      "Teach basic yielding to leash pressure in simple directions.",
      "Apply leash communication to obedience positions and transitions.",
      "Proof leash understanding through movement, distractions, and public handling.",
    ],
    criticalTrainerNotes: [
      "Pressure should turn off as soon as the dog makes the correct decision.",
      "Soft understanding beats forceful dragging every time.",
    ],
    commonMistakes: [
      "Keeping steady pressure on after the dog yields.",
      "Mistaking physical restraint for true leash understanding.",
    ],
    finalGoal:
      "The dog understands leash pressure clearly and follows guidance without conflict or resistance.",
  },
  {
    title: "Place Command System",
    purpose:
      "Build a reliable stationary behavior that creates calm, boundary awareness, and household control.",
    corePrinciple:
      "Place is a controlled state of mind, not just a location on a cot.",
    phases: [
      "Teach value for going to place and staying briefly.",
      "Add duration, distance, handler movement, and release structure.",
      "Proof place around household triggers, guests, and public-style distractions.",
    ],
    criticalTrainerNotes: [
      "The release cue must stay clean or duration will weaken.",
      "Reset quickly when the dog breaks instead of negotiating.",
    ],
    commonMistakes: [
      "Over-talking the dog through place reps.",
      "Advancing to distraction before place duration is stable.",
    ],
    finalGoal:
      "The dog can hold place calmly and reliably until released, even around meaningful distractions.",
  },
  {
    title: "Recall Reliability Protocol",
    purpose:
      "Develop a fast, consistent recall that holds under distraction and emotional load.",
    corePrinciple:
      "Reliable recall is built through conditioned success, not wishful repetition of the cue.",
    phases: [
      "Build positive, clear recall mechanics on line and in low distraction.",
      "Add distance, movement, and controlled competing motivators.",
      "Proof recall around real-world distractions with fair accountability.",
    ],
    criticalTrainerNotes: [
      "Do not burn the cue with repeated ignored recalls.",
      "Reward speed and commitment, not casual compliance.",
    ],
    commonMistakes: [
      "Calling the dog when the handler cannot enforce the outcome.",
      "Only using recall to end fun or apply restrictions.",
    ],
    finalGoal:
      "The dog turns, commits, and returns promptly when called across environments.",
  },
  {
    title: "Puppy Foundation Protocol",
    purpose:
      "Build the early structure that supports obedience, confidence, neutrality, and household function.",
    corePrinciple:
      "Puppy work should create clarity and habits early before bad rehearsals become identity.",
    phases: [
      "Establish marker system, crate routine, name response, and basic engagement.",
      "Build simple obedience, leash understanding, and threshold manners.",
      "Expand confidence and neutrality through controlled exposure and structure.",
    ],
    criticalTrainerNotes: [
      "Short reps and clean routine matter more than long training blocks.",
      "Early structure prevents later conflict.",
    ],
    commonMistakes: [
      "Using freedom as a substitute for development.",
      "Waiting too long to build boundaries and handling tolerance.",
    ],
    finalGoal:
      "The puppy develops into a clear, engaged, manageable learner with stable habits and confidence.",
  },
  {
    title: "Drive Capping System",
    purpose:
      "Teach the dog to contain drive and remain responsive before, during, and after high-value work.",
    corePrinciple:
      "Drive is useful only when it stays under handler control.",
    phases: [
      "Create clear on-off patterns around reward presentation.",
      "Build obedience before access to drive outlets.",
      "Proof capping during dynamic reps, transitions, and frustration moments.",
    ],
    criticalTrainerNotes: [
      "Drive capping should preserve intensity while improving control.",
      "Use stillness and clarity to teach control before adding chaos.",
    ],
    commonMistakes: [
      "Rewarding screaming, spinning, or anticipatory breaking.",
      "Suppressing drive so hard that the dog loses working intensity.",
    ],
    finalGoal:
      "The dog can hold composed, responsive drive and release it only through handler criteria.",
  },
  {
    title: "Structured Heel Protocol",
    purpose:
      "Build a precise, calm, and durable heel position that holds through movement and distraction.",
    corePrinciple:
      "Heel is a position with responsibility, not loose proximity to the handler.",
    phases: [
      "Teach the position and reward zone with clear start-stop mechanics.",
      "Build duration, turns, pace changes, and resets under control.",
      "Proof heel in real environments with distraction and longer working windows.",
    ],
    criticalTrainerNotes: [
      "Reward placement should support the position you want.",
      "Reset sloppy reps early before they become the new normal.",
    ],
    commonMistakes: [
      "Allowing forging, lagging, or crowding because the dog is 'close enough'.",
      "Adding long duration before the position is truly understood.",
    ],
    finalGoal:
      "The dog can hold a clean heel position through realistic movement and distractions.",
  },
  {
    title: "Service Dog Foundation Protocol",
    purpose:
      "Develop the neutrality, obedience, recovery, and public stability needed for future service dog work.",
    corePrinciple:
      "Service dog standards depend on strong foundational neutrality before task complexity.",
    phases: [
      "Build engagement, leash clarity, settle behavior, and public composure.",
      "Add duration, recovery, and controlled exposure to public environments.",
      "Layer task foundations only after public stability is dependable.",
    ],
    criticalTrainerNotes: [
      "Public neutrality is not optional groundwork.",
      "Task ambition should never outrun obedience stability.",
    ],
    commonMistakes: [
      "Prioritizing tasks while the dog is still environmentally unstable.",
      "Excusing public mistakes because the dog is smart or friendly.",
    ],
    finalGoal:
      "The dog shows the composure, neutrality, and obedience base needed for legitimate service development.",
  },
  {
    title: "Boarding Integration Protocol",
    purpose:
      "Help dogs transition cleanly into boarding routines with minimal stress and strong structure carryover.",
    corePrinciple:
      "Boarding success depends on predictable routine, handler neutrality, and immediate structure.",
    phases: [
      "Stabilize intake routine, crate transition, and environmental decompression.",
      "Apply house rules, feeding routine, and controlled handling from day one.",
      "Generalize boarding structure into training, exercise, and transfer back to owners.",
    ],
    criticalTrainerNotes: [
      "The first routine sets the tone for the stay.",
      "Neutral, confident handling reduces transition stress better than excess emotion.",
    ],
    commonMistakes: [
      "Giving too much freedom before the dog understands the routine.",
      "Changing structure standards because the dog is stressed or vocal.",
    ],
    finalGoal:
      "The dog settles into boarding structure quickly and maintains clear behavior expectations throughout the stay.",
  },
  {
    title: "Trainer Standards Manual",
    purpose:
      "Define the professional operating standard for how Patriot K9 trainers think, speak, coach, and progress dogs.",
    corePrinciple:
      "The trainer must stay calm, structured, observant, and consistent before expecting those qualities from the dog.",
    phases: [
      "Assess the dog honestly and identify the real phase problem.",
      "Select the least complicated protocol that solves the current issue.",
      "Progress only when clarity, control, and consistency are present in both dog and handler.",
    ],
    criticalTrainerNotes: [
      "Do not over-diagnose when a clean foundation fix is enough.",
      "Explain training in simple terms the handler can execute.",
      "Every recommendation should tie back to criteria and progression logic.",
    ],
    commonMistakes: [
      "Advancing because the handler wants speed rather than because the dog is ready.",
      "Giving theory without a structured next action.",
      "Confusing intensity with leadership.",
    ],
    finalGoal:
      "Every trainer response reflects Patriot K9 Command: calm, direct, structured, and professional.",
  },
];

export function buildPatriotK9DoctrinePrompt() {
  return patriotK9Protocols
    .map((protocol) => {
      const phases = protocol.phases.map((phase, index) => `${index + 1}. ${phase}`);
      const notes = protocol.criticalTrainerNotes.map((note) => `- ${note}`);
      const mistakes = protocol.commonMistakes.map((mistake) => `- ${mistake}`);

      return [
        `PROTOCOL: ${protocol.title}`,
        `Purpose: ${protocol.purpose}`,
        `Core Principle: ${protocol.corePrinciple}`,
        "Phases:",
        ...phases,
        "Critical Trainer Notes:",
        ...notes,
        "Common Mistakes:",
        ...mistakes,
        `Final Goal: ${protocol.finalGoal}`,
      ].join("\n");
    })
    .join("\n\n");
}
