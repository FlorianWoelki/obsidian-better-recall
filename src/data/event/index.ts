import type { EventType, EventMap, AnyEvent } from './events';

export interface Event<P = unknown> {
  payload?: P;
}

type EventListener<E extends AnyEvent> = (event: E) => void;

interface ListenerEntry<E extends AnyEvent> {
  listener: EventListener<E>;
  once: boolean;
  priority: number;
}

export class EventEmitter {
  private listeners: { [K in EventType]?: ListenerEntry<EventMap[K]>[] } = {};

  on<K extends EventType>(
    type: K,
    listener: EventListener<EventMap[K]>,
    priority = 0,
  ): void {
    this.listeners[type] ??= [];
    this.listeners[type].push({ listener, once: false, priority });
    this.sortListeners(type);
  }

  once<K extends EventType>(
    type: K,
    listener: EventListener<EventMap[K]>,
    priority = 0,
  ): void {
    this.listeners[type] ??= [];
    this.listeners[type].push({ listener, once: true, priority });
    this.sortListeners(type);
  }

  off<K extends EventType>(
    type: K,
    listener: EventListener<EventMap[K]>,
  ): void {
    const entries = this.listeners[type];
    if (!entries) {
      return;
    }

    this.listeners[type] = entries.filter(
      (entry) => entry.listener !== listener,
    ) as NonNullable<(typeof this.listeners)[K]>;
  }

  emit<K extends EventType>(type: K, payload: EventMap[K]['payload']): void {
    const listeners = this.listeners[type];
    if (!listeners) {
      return;
    }

    const event = { payload } as EventMap[K];
    listeners.slice().forEach((entry) => {
      entry.listener(event);
      if (entry.once) {
        this.off(type, entry.listener);
      }
    });
  }

  private sortListeners<K extends EventType>(type: K): void {
    if (this.listeners[type]) {
      this.listeners[type]?.sort((a, b) => b.priority - a.priority);
    }
  }
}
