import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../EventBus.js';

describe('EventBus', () => {
  it('should call listener when event is emitted', () => {
    const bus = new EventBus();
    const fn = vi.fn();
    bus.on('test', fn);
    bus.emit('test', { a: 1 });
    expect(fn).toHaveBeenCalledWith({ a: 1 });
  });

  it('should support multiple listeners', () => {
    const bus = new EventBus();
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    bus.on('evt', fn1);
    bus.on('evt', fn2);
    bus.emit('evt', 42);
    expect(fn1).toHaveBeenCalledWith(42);
    expect(fn2).toHaveBeenCalledWith(42);
  });

  it('should not call listener after off()', () => {
    const bus = new EventBus();
    const fn = vi.fn();
    bus.on('evt', fn);
    bus.off('evt', fn);
    bus.emit('evt');
    expect(fn).not.toHaveBeenCalled();
  });

  it('on() returns unsubscribe function', () => {
    const bus = new EventBus();
    const fn = vi.fn();
    const unsub = bus.on('evt', fn);
    unsub();
    bus.emit('evt');
    expect(fn).not.toHaveBeenCalled();
  });

  it('destroy() removes all listeners', () => {
    const bus = new EventBus();
    const fn = vi.fn();
    bus.on('a', fn);
    bus.on('b', fn);
    bus.destroy();
    bus.emit('a');
    bus.emit('b');
    expect(fn).not.toHaveBeenCalled();
  });

  it('should not throw when emitting event with no listeners', () => {
    const bus = new EventBus();
    expect(() => bus.emit('nope')).not.toThrow();
  });

  it('should catch errors in listeners without affecting others', () => {
    const bus = new EventBus();
    const bad = vi.fn(() => { throw new Error('oops'); });
    const good = vi.fn();
    bus.on('evt', bad);
    bus.on('evt', good);
    bus.emit('evt');
    expect(bad).toHaveBeenCalled();
    expect(good).toHaveBeenCalled();
  });
});
