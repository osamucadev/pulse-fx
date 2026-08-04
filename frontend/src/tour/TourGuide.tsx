import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ACTIONS, EVENTS, Joyride, STATUS, type EventData } from 'react-joyride'
import { useIndicators } from '../hooks/useIndicators'
import { buildTourSteps, type TourStep } from './steps'
import { useTour } from './useTour'

const TOUR_SEEN_KEY = 'pulse-fx-tour-seen'

export function TourGuide() {
  const { run, stepIndex, setStepIndex, startTour, stopTour } = useTour()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: indicators, isLoading } = useIndicators()

  // The step list is frozen for the duration of a run, computed from
  // whatever indicator data is available right when it starts (see the
  // effect below), so the step count and indices stay stable while the
  // tour is in progress even if the underlying data changes meanwhile.
  const [steps, setSteps] = useState<TourStep[]>(() => buildTourSteps([]))
  const wasRunningRef = useRef(false)

  // Starts the tour automatically on the very first visit only. Waits
  // for indicator data to finish loading first, so the conditional steps
  // (sync banner, second-indicator tip) are filtered correctly from the
  // very first run instead of defaulting to an empty list.
  useEffect(() => {
    if (isLoading) {
      return
    }

    if (!localStorage.getItem(TOUR_SEEN_KEY)) {
      localStorage.setItem(TOUR_SEEN_KEY, 'true')
      startTour()
    }
  }, [isLoading, startTour])

  useEffect(() => {
    if (run && !wasRunningRef.current) {
      setSteps(buildTourSteps(indicators ?? []))
    }

    wasRunningRef.current = run
  }, [run, indicators])

  const currentStep = steps[stepIndex]
  const isOnStepRoute = !currentStep || currentStep.route === location.pathname

  // If the active step lives on a different route than the one we're on
  // (starting the tour from a page other than "/", or moving to a step
  // on the indicator detail page), navigate there first. Joyride itself
  // is only told to run once the route already matches (see the `run`
  // prop below), so it never tries to position a spotlight before React
  // Router has rendered the right page. Once there, Joyride's own
  // `targetWaitTimeout` covers the remaining gap while the page's data
  // is still loading (see the chart step in steps.ts, right after this
  // kind of navigation).
  useEffect(() => {
    if (run && currentStep && !isOnStepRoute) {
      navigate(currentStep.route)
    }
  }, [run, currentStep, isOnStepRoute, navigate])

  const handleEvent = useCallback(
    (data: EventData) => {
      const { status, type, index, action } = data

      // Closing via the X button (or the overlay, both fire ACTIONS.CLOSE)
      // must stop the tour just like finishing or skipping it, so the
      // overlay disappears together with the tooltip instead of the
      // Joyride internals being left in a paused, half-visible state.
      if (status === STATUS.FINISHED || status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
        stopTour()
        return
      }

      if (type === EVENTS.TARGET_NOT_FOUND || type === EVENTS.ERROR) {
        stopTour()
        return
      }

      if (type === EVENTS.STEP_AFTER && (action === ACTIONS.NEXT || action === ACTIONS.PREV)) {
        const nextIndex = index + (action === ACTIONS.NEXT ? 1 : -1)

        if (!steps[nextIndex]) {
          stopTour()
          return
        }

        setStepIndex(nextIndex)
      }
    },
    [steps, setStepIndex, stopTour],
  )

  return (
    <Joyride
      run={run && isOnStepRoute}
      stepIndex={stepIndex}
      steps={steps}
      continuous
      onEvent={handleEvent}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Concluir',
        next: 'Próximo',
        nextWithProgress: 'Próximo ({current} de {total})',
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
