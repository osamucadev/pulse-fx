import { useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ACTIONS, EVENTS, Joyride, STATUS, type EventData } from 'react-joyride'
import { tourSteps } from './steps'
import { useTour } from './useTour'

const TOUR_SEEN_KEY = 'pulse-fx-tour-seen'

export function TourGuide() {
  const { run, stepIndex, setStepIndex, startTour, stopTour } = useTour()
  const navigate = useNavigate()
  const location = useLocation()

  // Starts the tour automatically on the very first visit only.
  useEffect(() => {
    if (!localStorage.getItem(TOUR_SEEN_KEY)) {
      localStorage.setItem(TOUR_SEEN_KEY, 'true')
      startTour()
    }
  }, [startTour])

  const currentStep = tourSteps[stepIndex]
  const isOnStepRoute = !currentStep || currentStep.route === location.pathname

  // If the active step lives on a different route than the one we're on
  // (starting the tour from a page other than "/", or moving to a step
  // on the indicator detail page), navigate there first. Joyride itself
  // is only told to run once the route already matches (see the `run`
  // prop below), so it never tries to position a spotlight before React
  // Router has rendered the right page. Once there, Joyride's own
  // `targetWaitTimeout` covers the remaining gap while the page's data
  // is still loading (see the 6th step in steps.ts, right after this
  // kind of navigation).
  useEffect(() => {
    if (run && currentStep && !isOnStepRoute) {
      navigate(currentStep.route)
    }
  }, [run, currentStep, isOnStepRoute, navigate])

  const handleEvent = useCallback(
    (data: EventData) => {
      const { status, type, index, action } = data

      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
        stopTour()
        return
      }

      if (type === EVENTS.TARGET_NOT_FOUND || type === EVENTS.ERROR) {
        stopTour()
        return
      }

      if (type === EVENTS.STEP_AFTER && (action === ACTIONS.NEXT || action === ACTIONS.PREV)) {
        const nextIndex = index + (action === ACTIONS.NEXT ? 1 : -1)

        if (!tourSteps[nextIndex]) {
          stopTour()
          return
        }

        setStepIndex(nextIndex)
      }
    },
    [setStepIndex, stopTour],
  )

  return (
    <Joyride
      run={run && isOnStepRoute}
      stepIndex={stepIndex}
      steps={tourSteps}
      continuous
      onEvent={handleEvent}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Concluir',
        next: 'Próximo',
        skip: 'Pular',
      }}
      options={{
        primaryColor: '#EA6A12',
        skipBeacon: true,
        showProgress: true,
      }}
      styles={{
        tooltip: { borderRadius: 8 },
        tooltipTitle: { fontWeight: 600 },
        buttonPrimary: { borderRadius: 6 },
        spotlight: { stroke: '#EA6A12', strokeWidth: 2 },
      }}
    />
  )
}
