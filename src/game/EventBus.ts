export type Listener<T> = (payload: T) => void;

export class TypedEventBus<Events extends object> {
  private readonly listeners: {
    [Key in keyof Events]?: Set<Listener<Events[Key]>>;
  } = {};

  on<Key extends keyof Events>(event: Key, listener: Listener<Events[Key]>): () => void {
    const listeners = (this.listeners[event] ??= new Set<Listener<Events[Key]>>());
    listeners.add(listener);

    return () => listeners.delete(listener);
  }

  emit<Key extends keyof Events>(event: Key, payload: Events[Key]): void {
    this.listeners[event]?.forEach((listener) => listener(payload));
  }
}
