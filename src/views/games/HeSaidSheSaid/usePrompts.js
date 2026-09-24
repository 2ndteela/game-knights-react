import { useEffect, useState } from 'react'
import { getHsssPrompts } from '../../../utilities/services'

export const defaultPrompts = [
  {
    mainTextOptions: ["Write a boy's name", "Gimme a boy's name", "What's the guy's name?"],
  },
  {
    mainTextOptions: ["Now a girl's name", "And now a girl", "Write a girl's name"]
  },
  {
    mainTextOptions: ["Where are they?", "Where is the story taking place?", "Where are they at?"],
  },
  {
    mainTextOptions: ['What are they doing?', 'What are they doing there?', "What's happening?"],
  },
  {
    mainTextOptions: ['The guy speaks up and says', 'The boy says', 'The guy says', 'The guy speaks first and says']
  },
  {
    mainTextOptions: ['The girl responds', 'Then the girl says', 'The girl speaks up and says']
  },
  {
    mainTextOptions: ['The boy responds', 'Now the boy speaks again', 'The boy then says']
  },
  {
    mainTextOptions: ['The girl responds', 'Finally, the girl says', 'In closing, the girl says']
  },
  {
    mainTextOptions: ["What's the moral of the story?", 'The moral of the story is', 'What did we learn from this story?']
  },
  {
    mainTextOptions: ['Now give it a hashtag', "What's the hashtag?", 'What is the hashtag of the story?']
  }
]

// The standard story asks the same thing several ways so two players rarely see
// identical wording. The first phrasing of each is the plainest, which is what
// the create screen uses to show a host what belongs in each slot.
export const defaultPromptTexts = defaultPrompts.map(p => p.mainTextOptions[0])

// A host's own prompts are stored as plain strings -- they wrote one phrasing,
// not several -- so they are widened into the shape above and the game itself
// never has to know which kind of story it is running.
const asPrompt = text => ({ mainTextOptions: [text] })

export const toPrompts = stored =>
  Array.isArray(stored) && stored.length ? stored.map(asPrompt) : defaultPrompts

// Prompts live on the game, so they have to be fetched before the first one can
// be shown. `loading` is what keeps a player from answering a default prompt for
// a second while their host's custom set is still in flight.
export default function usePrompts() {
  const [prompts, setPrompts] = useState(defaultPrompts)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const stored = await getHsssPrompts()
      if (cancelled) return

      setPrompts(toPrompts(stored))
      setLoading(false)
    }

    load()

    return () => { cancelled = true }
  }, [])

  return {
    prompts,
    setPrompts,
    loading
  }
}
