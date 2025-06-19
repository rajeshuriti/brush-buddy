export interface RoutineStep {
  id: number;
  title: string;
  dialogue: string;
  prompt: string;
  hasTimer: boolean;
  isIntro?: boolean;
  isConclusion?: boolean;
}

export const routineSteps: RoutineStep[] = [
  {
    id: 0,
    title: "Welcome to Brush Buddy!",
    dialogue: "Hi there, superstar! Welcome to Brush Buddy! I'm here to help you have the most amazing tooth-brushing adventure ever! Are you ready to make your teeth sparkle like diamonds?",
    prompt: "Say 'Start Brushing!' or tap the button to begin!",
    hasTimer: false,
    isIntro: true,
  },
  {
    id: 1,
    title: "The Water Whistle Warm-Up!",
    dialogue: "Awesome! Let's get started on the path to sparkling teeth! First, let's give our toothbrush a drink! Hold your brush under the faucet and let a little water splash on it. Then, take a quick sip of water yourself and hold it in your mouth – just for a second! Swish, swish, then spit! Great job!",
    prompt: "Say 'Next!' or tap the button when you're ready to move on!",
    hasTimer: true,
  },
  {
    id: 2,
    title: "Toothpaste Power-Up!",
    dialogue: "Now for the magic toothpaste! Squeeze a tiny, pea-sized blob of toothpaste onto your wet brush. It's like super-power fuel for your teeth! And then, just a tiny sprinkle of water on top of the paste, like morning dew! Tell me 'Done!' when your brush is charged up!",
    prompt: "Say 'Done!' or tap the button when your brush is ready!",
    hasTimer: true,
  },
  {
    id: 3,
    title: "The Tooth-Tango!",
    dialogue: "Woohoo! It's time for the main event! We're going to do the Tooth-Tango! Brush your top teeth, brush your bottom teeth, brush the insides and outsides! Take your time and make them sparkle!",
    prompt: "Brush until you're ready! Say 'Next!' or tap the button when your teeth are sparkling!",
    hasTimer: true,
  },
  {
    id: 4,
    title: "Bubble Blast Off!",
    dialogue: "Fantastic brushing! Now, time for the bubble blast off! Lean over the sink and spit out all those foamy bubbles. Whoosh! Great aim!",
    prompt: "Say 'Next!' or tap the button after you've spit!",
    hasTimer: true,
  },
  {
    id: 5,
    title: "Second Round Super Brush!",
    dialogue: "You're doing so well! Let's give those teeth another quick polish, just to make sure they're extra shiny! Ready for one more quick round of brushing?",
    prompt: "Say 'Ready!' or tap the button when you're ready for the second round!",
    hasTimer: true,
  },
  {
    id: 6,
    title: "Final Foam Farewell!",
    dialogue: "Amazing! Now, spit out any last bit of toothpaste foam. Bye-bye, bubbles!",
    prompt: "Say 'Next!' or tap the button after spitting!",
    hasTimer: true,
  },
  {
    id: 7,
    title: "Brush's Bath Time!",
    dialogue: "Your toothbrush worked so hard! Let's give it a nice bath. Rinse your toothbrush really well under the water until it's super clean and ready for its next adventure. Give it a shake!",
    prompt: "Say 'Done!' or tap the button when your brush is clean!",
    hasTimer: true,
  },
  {
    id: 8,
    title: "Gargle Roar!",
    dialogue: "Time for the mighty gargle roar! Take a sip of water, tilt your head back, and make some fun 'GAAARRRGGGLE' sounds! Try to make a loud one! Ready? ... Wow! That was a powerful gargle! Now spit!",
    prompt: "Say 'Next!' or tap the button after your gargle roar!",
    hasTimer: true,
  },
  {
    id: 9,
    title: "Mouth Refresh Mission!",
    dialogue: "Now, take another sip of water and swish it all around your mouth, like a tiny washing machine for your cheeks! Swish, swish, swish! And spit! Your mouth must feel so fresh!",
    prompt: "Say 'Next!' or tap the button when your mouth feels fresh!",
    hasTimer: true,
  },
  {
    id: 10,
    title: "Tongue Tidy-Up Trooper!",
    dialogue: "Don't forget the secret hideout for germs – your tongue! Gently brush your tongue three times. One... two... three! You're a real tongue-tidying trooper!",
    prompt: "Say 'Done!' or tap the button after cleaning your tongue!",
    hasTimer: true,
  },
  {
    id: 11,
    title: "Encore Gargle & Rinse!",
    dialogue: "Almost there, superstar! One last gargle for good measure, and then a final refreshing rinse! Take a big swish and spit! You're practically a dental hygienist!",
    prompt: "Say 'Next!' or tap the button after your final rinse!",
    hasTimer: true,
  },
  {
    id: 12,
    title: "Basin Bling Blitz!",
    dialogue: "Last but not least, let's make our wash basin sparkle just like your new super-clean teeth! Give it a quick rinse with water and maybe a little wipe. Awesome job making everything tidy!",
    prompt: "Say 'Done!' or tap the button when the basin sparkles!",
    hasTimer: true,
  },
  {
    id: 13,
    title: "Brushing Champion!",
    dialogue: "You did it, Superstar! Your teeth are sparkling, your breath is fresh, and you just rocked your morning brushing adventure! Give yourself a big high-five! You're ready to conquer the day with that dazzling smile! Great job!",
    prompt: "Brushing routine complete! Tap 'Start Over' or say 'Start Over' to do it again!",
    hasTimer: false,
    isConclusion: true,
  },
];

export const getStepById = (id: number): RoutineStep | undefined => {
  return routineSteps.find(step => step.id === id);
};

export const getNextStep = (currentId: number): RoutineStep | undefined => {
  return routineSteps.find(step => step.id === currentId + 1);
};

export const getTotalSteps = (): number => {
  return routineSteps.length;
};
