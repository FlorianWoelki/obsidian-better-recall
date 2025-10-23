import {
  expect,
  afterEach,
  beforeEach,
  describe,
  it,
  vi,
  vitest,
} from 'vitest';
import { KeyboardListener } from './KeyboardListener';

let inputEl: HTMLInputElement;
let listener: KeyboardListener;
let events: { [key: string]: EventListener };

beforeEach(() => {
  inputEl = document.createElement('input');
  events = {};

  inputEl.addEventListener = vitest.fn(
    (event: string, callback: EventListener) => {
      events[event] = callback;
    },
  );
  inputEl.removeEventListener = vitest.fn(
    (event: string, callback: EventListener) => {
      delete events[event];
    },
  );

  listener = new KeyboardListener(inputEl);
  vitest.useFakeTimers();
});

afterEach(() => {
  vitest.clearAllTimers();
  vitest.useRealTimers();
});

describe('events', () => {
  it('should add keypress event listener when `addKeyEnterAction` is called', () => {
    listener.addKeyEnterAction();

    expect(inputEl.addEventListener).toHaveBeenCalledWith(
      'keypress',
      expect.any(Function),
    );
    expect(events['keypress']).toBeDefined();
  });

  it('should remove keypress event listener when `addKeyEnterAction` is called', () => {
    listener.addKeyEnterAction();
    listener.removeKeyEnterAction();

    expect(inputEl.removeEventListener).toHaveBeenCalledWith(
      'keypress',
      expect.any(Function),
    );
    expect(events['keypress']).toBeUndefined();
  });

  it('should call `removeKeyEnterAction` when cleanup is invoked', () => {
    const spy = vitest.spyOn(listener, 'removeKeyEnterAction');
    listener.cleanup();
    expect(spy).toHaveBeenCalled();
  });
});

describe('keyboard', () => {
  it('should call `onEnter` when Alt+Enter is pressed with non-empty input', () => {
    const onEnterSpy = vitest.spyOn(listener, 'onEnter');
    inputEl.value = 'some text';

    listener.addKeyEnterAction();

    const event = new KeyboardEvent('keypress', {
      key: 'Enter',
      altKey: true,
    });

    events['keypress'](event);
    vitest.advanceTimersByTime(1);

    expect(onEnterSpy).toHaveBeenCalled();
  });

  it('should not call `onEnter` when input is empty', () => {
    const onEnterSpy = vitest.spyOn(listener, 'onEnter');
    inputEl.value = '';

    listener.addKeyEnterAction();

    const event = new KeyboardEvent('keypress', {
      key: 'Enter',
      altKey: true,
    });

    events['keypress'](event);
    vitest.advanceTimersByTime(1);

    expect(onEnterSpy).not.toHaveBeenCalled();
  });
});
