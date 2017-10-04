const keyFrom = event => `${event.altKey ? 'alt-': ''}${event.key && event.key}`

const Mode = {
  NORMAL: 'NORMAL',
  INSERT: 'INSERT'
}

const state = stateClojure({
    mode: Mode.NORMAL,
    anchorOffset: 0,
    debug: false
  },
  () => document.getElementById('pageContainer').dispatchEvent(new Event('vimflowy.stateChanged'))
)

const debug = (...args) => state.get().debug && console.log(...args)

const modeIndicator = (mainContainer, getState) => {
  const indicatorElement = document.createElement('div')
  indicatorElement.setAttribute('style', 'position: fixed; z-index:9001; bottom:0; left: 0; background-color: grey; color: white; padding: .3em; font-family: sans-serif;')
  indicatorElement.innerHTML = 'NORMAL'
  document.querySelector('body').append(indicatorElement)

  mainContainer.addEventListener('vimflowy.stateChanged', () => {
    const {mode} = getState()
    indicatorElement.innerHTML = mode
  })

  let timerId = null

  return {
    flashMode: (temporaryMode, duration = 1000) => {
      clearTimeout(timerId)
      indicatorElement.innerHTML = temporaryMode
      timerId = setTimeout(() => {
        indicatorElement.innerHTML = getState().mode
      }, duration)
    }
  }
}

const goToInsertMode = (cursorRight = false) => {
  state.set(s => ({mode: Mode.INSERT}))
  document.getSelection().modify('extend', 'left', 'character')
  if (cursorRight) {
    document.getSelection().modify('move', 'right', 'character')
  }
}

const goToNormalMode = () => {
  state.set(s => ({mode: Mode.NORMAL}))
  document.getSelection().modify('extend', 'left', 'character')
}

$(() => {
  window.toggleDebugging = () => state.set(s => ({
    debug: !s.debug
  }))

  searchBox(state.set, state.get)

  const mainContainer = document.getElementById('pageContainer')

  const {flashMode} = modeIndicator(mainContainer, state.get)

  const onlyIfProjectCanBeEdited = command => target => {
    const targetProject = projectAncestor(target)
    const isMainDotOfForeignSharedList = targetProject.className.includes('addedShared')

    const isNotEditable = targetProject.getAttribute('data-tid') === '2'

    const commandShouldBePrevented = isMainDotOfForeignSharedList || isNotEditable

    if (commandShouldBePrevented) {
        flashMode('Cannot edit this')
        return
    }

    command(target)
  }

  mainContainer.addEventListener('keydown', event => {
    const e = jQuery.Event('keydown')

    const actionMap = {
      [Mode.NORMAL]: {
        h: moveCursorLeft,
        j: target => setCursorAfterVerticalMove(state.get().anchorOffset, moveCursorDown(target)),
        k: target => setCursorAfterVerticalMove(state.get().anchorOffset, moveCursorUp(target)),
        l: moveCursorRight,
        i: onlyIfProjectCanBeEdited(() => goToInsertMode()),
        a: onlyIfProjectCanBeEdited(() => goToInsertMode(true)),
        '/': searchCommand,
        '?': searchCommand,
        o: t => {
          moveCursorToEnd()
          goToInsertMode(true)
          e.which = 13
          $(t).trigger(e)
        },
        O: t => {
          moveCursorToStart()
          goToInsertMode()
          e.which = 13
          $(t).trigger(e)
        },
        '0': moveCursorToStart,
        '^': moveCursorToStart,
        '$': moveCursorToEnd,
        'I': onlyIfProjectCanBeEdited(() => {
          moveCursorToStart()
          goToInsertMode()
        }),
        'A': onlyIfProjectCanBeEdited(() => {
          moveCursorToEnd()
          goToInsertMode(true)
        }),
        'alt-l': t => {
          state.set(s => ({anchorOffset: 0}))
          e.which = 39
          e.altKey = true
          $(t).trigger(e)
        },
        'alt-h': t => {
          state.set(s => ({anchorOffset: 0}))
          e.which = 37
          e.altKey = true
          $(t).trigger(e)
        },
        Escape: goToNormalMode,
        Esc: () => console.log('MAC WTF') || goToNormalMode() // mac?
      },
      [Mode.INSERT]: {
        Escape: goToNormalMode,
        Esc: () => console.log('MAC WTF') || goToNormalMode() // mac?
      }
    }

    debug(state.get().mode, keyFrom(event), event)

    if (actionMap[state.get().mode][keyFrom(event)]) {
      event.preventDefault()


      actionMap[state.get().mode][keyFrom(event)](event.target)

      return
    }

    const input = '1234567890[{]};:\'",<.>/?\\+=_-)(*&^%$#@~`!abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.includes(event.key);
    const modified = !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
    if (state.get().mode === Mode.NORMAL && (input || modified)) {
      event.preventDefault()

      debug('prevented because NORMAL mode')
    }
  })
})
