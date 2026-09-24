import { useEffect, useMemo, useState } from 'react'
import { Button, Input, Radio, Tooltip, message } from 'antd'
import { ShareAltOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import './he-said-she-said-styles.less'
import {
  getHelpCreatingStory,
  listenForGameUpdates,
  removeGameFromDb,
  removeListener,
  setHsssPrompts,
  startGame
} from '../../../utilities/services'
import { cleanStoredData, getInviteLink, getStoredGameData } from '../../../utilities/utilities'
import { defaultPromptTexts } from './usePrompts'

// A story needs enough prompts to be worth passing around, but not all ten:
// blank rows are dropped, so a host can write a short one.
const MIN_PROMPTS = 3

const storyOptions = [
  { label: 'Standard story', value: 'default' },
  { label: 'Write my own', value: 'custom' }
]

export default function HeSaidSheSaidCreate() {
  const navigate = useNavigate()
  const { gameCode, playerId } = getStoredGameData()
  const [storyType, setStoryType] = useState('default')
  const [prompts, setPrompts] = useState(() => defaultPromptTexts.map(() => ''))
  const [starting, setStarting] = useState(false)
  const [gettingHelp, setGettingHelp] = useState(false)
  const [peopleInLobby, setPeopleInLobby] = useState(1)

  const custom = storyType === 'custom'

  const filledPrompts = useMemo(
    () => prompts.map(p => p.trim()).filter(Boolean),
    [prompts]
  )

  // Only the host picks the story, and only for a lobby that exists.
  useEffect(() => {
    if (!gameCode || playerId !== 0) navigate('/')
  }, [gameCode, navigate, playerId])

  // The lobby screen hands its listener off on the way here, so this one watches
  // the game itself: friends keep arriving while the host reads the prompts, and
  // a count frozen at whatever it was on arrival would read as nobody showing up.
  useEffect(() => {
    let listener = null

    listenForGameUpdates((data, gameListener) => {
      listener = gameListener
      if (data?.players?.length) setPeopleInLobby(data.players.length)
    })

    return () => { if (listener) removeListener(listener) }
  }, [])

  async function beginGame(customPrompts) {
    setStarting(true)

    // Written before the game starts: everyone else jumps to their first prompt
    // the moment the state changes, and they read the list on the way in.
    if (customPrompts) await setHsssPrompts(gameCode, customPrompts)

    await startGame(null)
    navigate('/hsss')
  }

  function editPrompt(idx, value) {
    setPrompts(current => current.map((p, i) => i === idx ? value : p))
  }

  // The lobby is already open by the time the host gets here, so backing out has
  // to close it: leaving it behind would keep handing out a code to a game that
  // nobody is going to start.
  function cancelLobby() {
    removeGameFromDb(gameCode)
    cleanStoredData()
    navigate('/')
  }

  function copySharableAddress() {
    navigator.clipboard.writeText(getInviteLink(gameCode, 'hsss'))
    message.info('Address copied to clipboard')
  }

  async function getAIHelp() {
    setGettingHelp(true)
    const suggestions = await getHelpCreatingStory(defaultPromptTexts)
    setGettingHelp(false)

    if (!suggestions) {
      message.warning('The story machine came up empty. Try again, or write your own prompts.')
      return
    }

    // A shorter list leaves the rest of the slots blank rather than keeping half
    // of an earlier set, which would read as prompts the host had approved.
    setPrompts(current => current.map((p, idx) => suggestions[idx] ?? ''))
  }

  function confirmStory() {
    if (!custom) {
      beginGame(null)
      return
    }

    if (filledPrompts.length < MIN_PROMPTS) {
      message.warning(`Write at least ${MIN_PROMPTS} prompts, or use the standard story instead`)
      return
    }

    beginGame(filledPrompts)
  }

  return (
    <div className="route-container" id="hsss-create-container">
      <h2>Pick a story</h2>
      <p>
        The standard story is ten prompts that build a scene between two people.
        Write your own set instead if you would rather send your friends somewhere else.
      </p>

      {/* The game is still in its lobby while the story gets picked, so friends
          can keep joining and the code has to stay in reach. */}
      <div className="code-row">
        <h2 className="lobby-code">{gameCode}</h2>
        <Tooltip title="Copy invite link">
          <Button
            icon={<ShareAltOutlined />}
            aria-label="Copy invite link"
            onClick={copySharableAddress}
          />
        </Tooltip>
      </div>
      <div>{peopleInLobby} {peopleInLobby === 1 ? 'person' : 'people'} in lobby</div>
      <br />

      <Radio.Group
        options={storyOptions}
        value={storyType}
        onChange={e => setStoryType(e.target.value)}
        optionType="button"
        buttonStyle="solid"
        className="radio-row"
      />

      {custom && (
        <div className="prompt-list">
          <Button onClick={getAIHelp} loading={gettingHelp} className="ai-help-button" >Get Help From AI</Button>
          {prompts.map((p, idx) => (
            <Input
              key={idx}
              value={p}
              placeholder={defaultPromptTexts[idx]}
              onChange={({ target }) => editPrompt(idx, target.value)}
              className="square-input prompt-input"
              maxLength={60}
            />
          ))}
          <div className="create-hint">
            {filledPrompts.length} of {prompts.length} written. Blank ones are skipped.
          </div>
        </div>
      )}

      <div className="create-actions">
        <Button danger size="large" onClick={cancelLobby} disabled={starting} >Cancel Lobby</Button>
        <Button
          type="primary"
          size="large"
          onClick={confirmStory}
          disabled={custom && filledPrompts.length < MIN_PROMPTS}
          loading={starting}
        >Start Game</Button>
      </div>
    </div>
  )
}
