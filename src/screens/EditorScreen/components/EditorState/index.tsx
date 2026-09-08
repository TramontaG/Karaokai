import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { EditorBehavior } from "../../behavior";
import { useRecursiveState } from "../../../../hooks/useRecursiveState";
import type { KaraokeProject } from "../../../../domain/project";
import type { DeepPartial } from "../../../../util/dataManipulation";

export type EditorInspectorTab = "properties" | "mixer";
export type TimelineTool = "pointer" | "split";

export interface EditorData extends Record<string, unknown> {
  project: KaraokeProject | null;
  currentTime: number;
  isPlaying: boolean;
  isAudioReady: boolean;
  selectedTrackId: string | null;
  selectedPhraseId: string | null;
  selectedWordId: string | null;
  trackPendingDeletionId: string | null;
  inspectorTab: EditorInspectorTab;
  timelineZoom: number;
  timelineTool: TimelineTool;
  bpmInputValue: string;
  trackScaleInputValue: string;
  phraseScaleInputValue: string;
  wordScaleInputValue: string;
  error: string | null;
  audioSources: { instrumental: string | null; vocals: string | null } | null;
}

const initialEditorData: EditorData = {
  project: null,
  currentTime: 0,
  isPlaying: false,
  isAudioReady: false,
  selectedTrackId: null,
  selectedPhraseId: null,
  selectedWordId: null,
  trackPendingDeletionId: null,
  inspectorTab: "properties",
  timelineZoom: 1,
  timelineTool: "pointer",
  bpmInputValue: "120",
  trackScaleInputValue: "100",
  phraseScaleInputValue: "",
  wordScaleInputValue: "",
  error: null,
  audioSources: null,
};

interface EditorDataContextValue {
  data: EditorData;
  setData: (patch: DeepPartial<EditorData>) => void;
}

const EditorDataContext = createContext<EditorDataContextValue | null>(null);

export function EditorStateProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useRecursiveState(initialEditorData);
  return (
    <EditorDataContext.Provider value={{ data, setData }}>
      {children}
    </EditorDataContext.Provider>
  );
}

export function useEditorData() {
  const context = useContext(EditorDataContext);
  if (!context)
    throw new Error("Editor state must be used inside its provider");
  return [context.data, context.setData] as const;
}

type Listener = () => void;

interface Subscription<TValue> {
  listener: Listener;
  selector: (behavior: EditorBehavior) => TValue;
  value: TValue;
}

interface EditorStore {
  getValue: () => EditorBehavior;
  setValue: (behavior: EditorBehavior) => void;
  subscribe: <TValue>(
    selector: (behavior: EditorBehavior) => TValue,
    listener: Listener
  ) => () => void;
}

function createEditorStore(initialValue: EditorBehavior): EditorStore {
  let value = initialValue;
  const subscriptions = new Set<Subscription<unknown>>();

  return {
    getValue: () => value,
    setValue: (nextValue) => {
      value = nextValue;
      subscriptions.forEach((subscription) => {
        const nextSelection = subscription.selector(value);
        if (Object.is(subscription.value, nextSelection)) return;
        subscription.value = nextSelection;
        subscription.listener();
      });
    },
    subscribe: (selector, listener) => {
      const subscription: Subscription<unknown> = {
        listener,
        selector,
        value: selector(value),
      };
      subscriptions.add(subscription);
      return () => subscriptions.delete(subscription);
    },
  };
}

const EditorBehaviorContext = createContext<EditorStore | null>(null);

export function EditorBehaviorProvider({
  behavior,
  children,
}: {
  behavior: EditorBehavior;
  children: ReactNode;
}) {
  const storeRef = useRef<EditorStore | null>(null);
  if (!storeRef.current) storeRef.current = createEditorStore(behavior);

  useLayoutEffect(() => {
    storeRef.current?.setValue(behavior);
  }, [behavior]);

  return (
    <EditorBehaviorContext.Provider value={storeRef.current}>
      {children}
    </EditorBehaviorContext.Provider>
  );
}

function useEditorStore() {
  const store = useContext(EditorBehaviorContext);
  if (!store) throw new Error("Editor state must be used inside its provider");
  return store;
}

export function useEditorState<TValue>(
  selector: (behavior: EditorBehavior) => TValue
) {
  const store = useEditorStore();
  return useSyncExternalStore(
    (listener) => store.subscribe(selector, listener),
    () => selector(store.getValue()),
    () => selector(store.getValue())
  );
}

export function useEditorBehavior() {
  return useEditorStore().getValue();
}
