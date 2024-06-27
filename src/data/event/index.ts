import type { EventType, EventMap } from './events';

export interface Event<T = unknown> {
  type: EventType;
  payload?: T;
}

type EventListener<T extends Event> = (event: T) => void;

interface ListenerEntry<T extends Event> {
  listener: EventListener<T>;
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
    this.listeners[type]?.push({ listener, once: false, priority });
    this.sortListeners(type);
  }

  once<K extends EventType>(
    type: K,
    listener: EventListener<EventMap[K]>,
    priority = 0,
  ): void {
    this.listeners[type] ??= [];
    this.listeners[type]?.push({ listener, once: true, priority });
    this.sortListeners(type);
  }

  off<K extends EventType>(
    type: K,
    listener: EventListener<EventMap[K]>,
  ): void {
    if (!this.listeners[type]) {
      return;
    }

    this.listeners[type] = this.listeners[type]?.filter(
      (entry) => entry.listener !== listener,
    );
  }

  emit<K extends EventType>(event: EventMap[K]): void {
    if (!this.listeners[event.type]) {
      return;
    }

    this.listeners[event.type]?.forEach((entry) => {
      entry.listener(event);
      if (entry.once) {
        this.off(event.type, entry.listener);
      }
    });
  }

  private sortListeners(type: EventType): void {
    if (this.listeners[type]) {
      this.listeners[type]?.sort((a, b) => b.priority - a.priority);
    }
  }
}
