
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { stylesheet } = info;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                info.rules = {};
            });
            managed_styles.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.47.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap$1(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function parse(str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules\svelte-spa-router\Router.svelte generated by Svelte v3.47.0 */

    const { Error: Error_1, Object: Object_1, console: console_1$1 } = globals;

    // (251:0) {:else}
    function create_else_block$4(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(251:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (244:0) {#if componentParams}
    function create_if_block$6(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(244:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$6, create_else_block$4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn('Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading');

    	return wrap$1({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf('#/');

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: '/';

    	// Check if there's a querystring
    	const qsPosition = location.indexOf('?');

    	let querystring = '';

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener('hashchange', update, false);

    	return function stop() {
    		window.removeEventListener('hashchange', update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);
    const params = writable(undefined);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == '#' ? '' : '#') + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == '#' ? '' : '#') + location;

    	try {
    		const newState = { ...history.state };
    		delete newState['__svelte_spa_router_scrollX'];
    		delete newState['__svelte_spa_router_scrollY'];
    		window.history.replaceState(newState, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn('Caught exception while replacing the current page. If you\'re running this in the Svelte REPL, please note that the `replace` method might not work in this environment.');
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event('hashchange'));
    }

    function link(node, opts) {
    	opts = linkOpts(opts);

    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != 'a') {
    		throw Error('Action "link" can only be used with <a> tags');
    	}

    	updateLink(node, opts);

    	return {
    		update(updated) {
    			updated = linkOpts(updated);
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, opts) {
    	let href = opts.href || node.getAttribute('href');

    	// Destination must start with '/' or '#/'
    	if (href && href.charAt(0) == '/') {
    		// Add # to the href attribute
    		href = '#' + href;
    	} else if (!href || href.length < 2 || href.slice(0, 2) != '#/') {
    		throw Error('Invalid value for "href" attribute: ' + href);
    	}

    	node.setAttribute('href', href);

    	node.addEventListener('click', event => {
    		// Prevent default anchor onclick behaviour
    		event.preventDefault();

    		if (!opts.disabled) {
    			scrollstateHistoryHandler(event.currentTarget.getAttribute('href'));
    		}
    	});
    }

    // Internal function that ensures the argument of the link action is always an object
    function linkOpts(val) {
    	if (val && typeof val == 'string') {
    		return { href: val };
    	} else {
    		return val || {};
    	}
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {string} href - Destination
     */
    function scrollstateHistoryHandler(href) {
    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Router', slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = '' } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != 'function' && (typeof component != 'object' || component._sveltesparouter !== true)) {
    				throw Error('Invalid component object');
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == 'string' && (path.length < 1 || path.charAt(0) != '/' && path.charAt(0) != '*') || typeof path == 'object' && !(path instanceof RegExp)) {
    				throw Error('Invalid value for "path" argument - strings must start with / or *');
    			}

    			const { pattern, keys } = parse(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == 'object' && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == 'string') {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || '/';
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || '/';
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || '') || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {boolean} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	let popStateChanged = null;

    	if (restoreScrollState) {
    		popStateChanged = event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.__svelte_spa_router_scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		};

    		// This is removed in the destroy() invocation below
    		window.addEventListener('popstate', popStateChanged);

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.__svelte_spa_router_scrollX, previousScrollState.__svelte_spa_router_scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	const unsubscribeLoc = loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData,
    				params: match && typeof match == 'object' && Object.keys(match).length
    				? match
    				: null
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick('conditionsFailed', detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoading', Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    						component,
    						name: component.name,
    						params: componentParams
    					}));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == 'object' && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    				component,
    				name: component.name,
    				params: componentParams
    			})).then(() => {
    				params.set(componentParams);
    			});

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    		params.set(undefined);
    	});

    	onDestroy(() => {
    		unsubscribeLoc();
    		popStateChanged && window.removeEventListener('popstate', popStateChanged);
    	});

    	const writable_props = ['routes', 'prefix', 'restoreScrollState'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		writable,
    		derived,
    		tick,
    		_wrap: wrap$1,
    		wrap,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		params,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		linkOpts,
    		scrollstateHistoryHandler,
    		onDestroy,
    		createEventDispatcher,
    		afterUpdate,
    		parse,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		popStateChanged,
    		lastLoc,
    		componentObj,
    		unsubscribeLoc
    	});

    	$$self.$inject_state = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ('component' in $$props) $$invalidate(0, component = $$props.component);
    		if ('componentParams' in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ('props' in $$props) $$invalidate(2, props = $$props.props);
    		if ('previousScrollState' in $$props) previousScrollState = $$props.previousScrollState;
    		if ('popStateChanged' in $$props) popStateChanged = $$props.popStateChanged;
    		if ('lastLoc' in $$props) lastLoc = $$props.lastLoc;
    		if ('componentObj' in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			history.scrollRestoration = restoreScrollState ? 'manual' : 'auto';
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\pages\Nav.svelte generated by Svelte v3.47.0 */

    const { console: console_1 } = globals;
    const file$6 = "src\\pages\\Nav.svelte";

    // (19:16) {:else}
    function create_else_block_5$1(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "HOME";
    			attr_dev(button, "type", "button");
    			set_style(button, "width", "100%");
    			set_style(button, "height", "100%");
    			attr_dev(button, "class", "btnBG svelte-16jpn0s");
    			add_location(button, file$6, 19, 16, 816);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_5$1.name,
    		type: "else",
    		source: "(19:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (15:16) {#if current_page == ''}
    function create_if_block_5$2(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "HOME";
    			attr_dev(button, "type", "button");
    			set_style(button, "width", "100%");
    			set_style(button, "height", "110%");
    			attr_dev(button, "class", "btnBGS svelte-16jpn0s");
    			add_location(button, file$6, 15, 16, 649);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$2.name,
    		type: "if",
    		source: "(15:16) {#if current_page == ''}",
    		ctx
    	});

    	return block;
    }

    // (32:16) {:else}
    function create_else_block_4$1(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "ACTION";
    			attr_dev(button, "type", "button");
    			set_style(button, "width", "100%");
    			set_style(button, "height", "100%");
    			attr_dev(button, "class", "btnBG svelte-16jpn0s");
    			add_location(button, file$6, 32, 16, 1338);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_4$1.name,
    		type: "else",
    		source: "(32:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (28:16) {#if current_page == 'action'}
    function create_if_block_4$3(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "ACTION";
    			attr_dev(button, "type", "button");
    			set_style(button, "width", "100%");
    			set_style(button, "height", "110%");
    			attr_dev(button, "class", "btnBGS svelte-16jpn0s");
    			add_location(button, file$6, 28, 16, 1169);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$3.name,
    		type: "if",
    		source: "(28:16) {#if current_page == 'action'}",
    		ctx
    	});

    	return block;
    }

    // (43:16) {:else}
    function create_else_block_3$1(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "EFFICACY";
    			attr_dev(button, "type", "button");
    			set_style(button, "width", "100%");
    			set_style(button, "height", "100%");
    			attr_dev(button, "class", "btnBG svelte-16jpn0s");
    			add_location(button, file$6, 43, 16, 1852);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3$1.name,
    		type: "else",
    		source: "(43:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (39:16) {#if current_page == 'efficacy'}
    function create_if_block_3$4(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "EFFICACY";
    			attr_dev(button, "type", "button");
    			set_style(button, "width", "100%");
    			set_style(button, "height", "110%");
    			attr_dev(button, "class", "btnBGS svelte-16jpn0s");
    			add_location(button, file$6, 39, 16, 1681);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$4.name,
    		type: "if",
    		source: "(39:16) {#if current_page == 'efficacy'}",
    		ctx
    	});

    	return block;
    }

    // (54:16) {:else}
    function create_else_block_2$1(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "BIOAVAILABILITY";
    			attr_dev(button, "type", "button");
    			set_style(button, "width", "100%");
    			set_style(button, "height", "100%");
    			attr_dev(button, "class", "btnBG svelte-16jpn0s");
    			add_location(button, file$6, 54, 16, 2365);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2$1.name,
    		type: "else",
    		source: "(54:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (50:16) {#if current_page == 'bio'}
    function create_if_block_2$4(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "BIOAVAILABILITY";
    			attr_dev(button, "type", "button");
    			set_style(button, "width", "100%");
    			set_style(button, "height", "110%");
    			attr_dev(button, "class", "btnBGS svelte-16jpn0s");
    			add_location(button, file$6, 50, 16, 2187);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$4.name,
    		type: "if",
    		source: "(50:16) {#if current_page == 'bio'}",
    		ctx
    	});

    	return block;
    }

    // (65:16) {:else}
    function create_else_block_1$1(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "COVID-19";
    			attr_dev(button, "type", "button");
    			set_style(button, "width", "100%");
    			set_style(button, "height", "100%");
    			attr_dev(button, "class", "btnBG svelte-16jpn0s");
    			add_location(button, file$6, 65, 16, 2886);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(65:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (61:16) {#if current_page == 'covid19'}
    function create_if_block_1$5(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "COVID-19";
    			attr_dev(button, "type", "button");
    			set_style(button, "width", "100%");
    			set_style(button, "height", "110%");
    			attr_dev(button, "class", "btnBGS svelte-16jpn0s");
    			add_location(button, file$6, 61, 16, 2715);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(61:16) {#if current_page == 'covid19'}",
    		ctx
    	});

    	return block;
    }

    // (76:16) {:else}
    function create_else_block$3(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "DOSAGE";
    			attr_dev(button, "type", "button");
    			set_style(button, "width", "100%");
    			set_style(button, "height", "100%");
    			attr_dev(button, "class", "btnBG svelte-16jpn0s");
    			add_location(button, file$6, 76, 16, 3396);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(76:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (72:16) {#if current_page == 'dosage'}
    function create_if_block$5(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "DOSAGE";
    			attr_dev(button, "type", "button");
    			set_style(button, "width", "100%");
    			set_style(button, "height", "110%");
    			attr_dev(button, "class", "btnBGS svelte-16jpn0s");
    			add_location(button, file$6, 72, 16, 3227);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(72:16) {#if current_page == 'dosage'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let a0;
    	let t1;
    	let a1;
    	let t2;
    	let a2;
    	let t3;
    	let a3;
    	let t4;
    	let a4;
    	let t5;
    	let a5;
    	let t6;
    	let button;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*current_page*/ ctx[0] == '') return create_if_block_5$2;
    		return create_else_block_5$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*current_page*/ ctx[0] == 'action') return create_if_block_4$3;
    		return create_else_block_4$1;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	function select_block_type_2(ctx, dirty) {
    		if (/*current_page*/ ctx[0] == 'efficacy') return create_if_block_3$4;
    		return create_else_block_3$1;
    	}

    	let current_block_type_2 = select_block_type_2(ctx);
    	let if_block2 = current_block_type_2(ctx);

    	function select_block_type_3(ctx, dirty) {
    		if (/*current_page*/ ctx[0] == 'bio') return create_if_block_2$4;
    		return create_else_block_2$1;
    	}

    	let current_block_type_3 = select_block_type_3(ctx);
    	let if_block3 = current_block_type_3(ctx);

    	function select_block_type_4(ctx, dirty) {
    		if (/*current_page*/ ctx[0] == 'covid19') return create_if_block_1$5;
    		return create_else_block_1$1;
    	}

    	let current_block_type_4 = select_block_type_4(ctx);
    	let if_block4 = current_block_type_4(ctx);

    	function select_block_type_5(ctx, dirty) {
    		if (/*current_page*/ ctx[0] == 'dosage') return create_if_block$5;
    		return create_else_block$3;
    	}

    	let current_block_type_5 = select_block_type_5(ctx);
    	let if_block5 = current_block_type_5(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			a0 = element("a");
    			if_block0.c();
    			t1 = space();
    			a1 = element("a");
    			if_block1.c();
    			t2 = space();
    			a2 = element("a");
    			if_block2.c();
    			t3 = space();
    			a3 = element("a");
    			if_block3.c();
    			t4 = space();
    			a4 = element("a");
    			if_block4.c();
    			t5 = space();
    			a5 = element("a");
    			if_block5.c();
    			t6 = space();
    			button = element("button");
    			button.textContent = "EXIT";
    			if (!src_url_equal(img.src, img_src_value = "assets/nav/BAR-LOGO.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "margin-right", "5%");
    			set_style(img, "margin-left", "2%");
    			set_style(img, "width", "14%");
    			attr_dev(img, "alt", "");
    			add_location(img, file$6, 12, 12, 391);
    			attr_dev(a0, "href", "#/");
    			attr_dev(a0, "class", "flex-fill mr-2");
    			add_location(a0, file$6, 13, 12, 502);
    			attr_dev(a1, "href", "#/action");
    			attr_dev(a1, "class", "flex-fill mr-2");
    			add_location(a1, file$6, 26, 12, 1010);
    			attr_dev(a2, "href", "#/efficacy");
    			attr_dev(a2, "class", "flex-fill mr-2");
    			add_location(a2, file$6, 37, 12, 1518);
    			attr_dev(a3, "href", "#/bio");
    			attr_dev(a3, "class", "flex-fill mr-2");
    			add_location(a3, file$6, 48, 12, 2034);
    			attr_dev(a4, "href", "#/covid19");
    			attr_dev(a4, "class", "flex-fill mr-2");
    			add_location(a4, file$6, 59, 12, 2554);
    			attr_dev(a5, "href", "#/dosage");
    			attr_dev(a5, "class", "flex-fill mr-2");
    			add_location(a5, file$6, 70, 12, 3068);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "flex-fill btnBG2 svelte-16jpn0s");
    			add_location(button, file$6, 81, 12, 3576);
    			attr_dev(div0, "id", "full");
    			attr_dev(div0, "class", "d-flex mb-1");
    			add_location(div0, file$6, 11, 8, 342);
    			attr_dev(div1, "class", "d-grid gap1");
    			add_location(div1, file$6, 10, 4, 307);
    			attr_dev(div2, "class", "navigation svelte-16jpn0s");
    			add_location(div2, file$6, 9, 0, 277);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div0, t0);
    			append_dev(div0, a0);
    			if_block0.m(a0, null);
    			append_dev(div0, t1);
    			append_dev(div0, a1);
    			if_block1.m(a1, null);
    			append_dev(div0, t2);
    			append_dev(div0, a2);
    			if_block2.m(a2, null);
    			append_dev(div0, t3);
    			append_dev(div0, a3);
    			if_block3.m(a3, null);
    			append_dev(div0, t4);
    			append_dev(div0, a4);
    			if_block4.m(a4, null);
    			append_dev(div0, t5);
    			append_dev(div0, a5);
    			if_block5.m(a5, null);
    			append_dev(div0, t6);
    			append_dev(div0, button);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link.call(null, a0)),
    					listen_dev(a0, "click", /*click_handler*/ ctx[2], false, false, false),
    					action_destroyer(link.call(null, a1)),
    					listen_dev(a1, "click", /*click_handler_1*/ ctx[3], false, false, false),
    					action_destroyer(link.call(null, a2)),
    					listen_dev(a2, "click", /*click_handler_2*/ ctx[4], false, false, false),
    					action_destroyer(link.call(null, a3)),
    					listen_dev(a3, "click", /*click_handler_3*/ ctx[5], false, false, false),
    					action_destroyer(link.call(null, a4)),
    					listen_dev(a4, "click", /*click_handler_4*/ ctx[6], false, false, false),
    					action_destroyer(link.call(null, a5)),
    					listen_dev(a5, "click", /*click_handler_5*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(a0, null);
    				}
    			}

    			if (current_block_type_1 !== (current_block_type_1 = select_block_type_1(ctx))) {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(a1, null);
    				}
    			}

    			if (current_block_type_2 !== (current_block_type_2 = select_block_type_2(ctx))) {
    				if_block2.d(1);
    				if_block2 = current_block_type_2(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(a2, null);
    				}
    			}

    			if (current_block_type_3 !== (current_block_type_3 = select_block_type_3(ctx))) {
    				if_block3.d(1);
    				if_block3 = current_block_type_3(ctx);

    				if (if_block3) {
    					if_block3.c();
    					if_block3.m(a3, null);
    				}
    			}

    			if (current_block_type_4 !== (current_block_type_4 = select_block_type_4(ctx))) {
    				if_block4.d(1);
    				if_block4 = current_block_type_4(ctx);

    				if (if_block4) {
    					if_block4.c();
    					if_block4.m(a4, null);
    				}
    			}

    			if (current_block_type_5 !== (current_block_type_5 = select_block_type_5(ctx))) {
    				if_block5.d(1);
    				if_block5 = current_block_type_5(ctx);

    				if (if_block5) {
    					if_block5.c();
    					if_block5.m(a5, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_block0.d();
    			if_block1.d();
    			if_block2.d();
    			if_block3.d();
    			if_block4.d();
    			if_block5.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Nav', slots, []);
    	let current_page = window.location.href.split('/').pop();

    	function activeNav(event) {
    		$$invalidate(0, current_page = window.location.href.split('/').pop());
    		console.log(current_page);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Nav> was created with unknown prop '${key}'`);
    	});

    	const click_handler = event => {
    		activeNav();
    	};

    	const click_handler_1 = event => {
    		activeNav();
    	};

    	const click_handler_2 = event => {
    		activeNav();
    	};

    	const click_handler_3 = event => {
    		activeNav();
    	};

    	const click_handler_4 = event => {
    		activeNav();
    	};

    	const click_handler_5 = event => {
    		activeNav();
    	};

    	$$self.$capture_state = () => ({ link, location, current_page, activeNav });

    	$$self.$inject_state = $$props => {
    		if ('current_page' in $$props) $$invalidate(0, current_page = $$props.current_page);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		current_page,
    		activeNav,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5
    	];
    }

    class Nav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nav",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut } = {}) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => 'overflow: hidden;' +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const sd = 1 - start;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
        };
    }

    /* src\pages\Home.svelte generated by Svelte v3.47.0 */
    const file$5 = "src\\pages\\Home.svelte";

    function create_fragment$6(ctx) {
    	let t0;
    	let section;
    	let div3;
    	let div1;
    	let img0;
    	let img0_src_value;
    	let t1;
    	let div0;
    	let img1;
    	let img1_src_value;
    	let t2;
    	let div2;
    	let img2;
    	let img2_src_value;

    	const block = {
    		c: function create() {
    			t0 = space();
    			section = element("section");
    			div3 = element("div");
    			div1 = element("div");
    			img0 = element("img");
    			t1 = space();
    			div0 = element("div");
    			img1 = element("img");
    			t2 = space();
    			div2 = element("div");
    			img2 = element("img");
    			document.title = "Drenex | Home";
    			if (!src_url_equal(img0.src, img0_src_value = "assets/1/final.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "class", "animate__animated animate__fadeIn");
    			set_style(img0, "width", "75%");
    			set_style(img0, "margin-top", "10%");
    			attr_dev(img0, "alt", "");
    			add_location(img0, file$5, 10, 12, 256);
    			if (!src_url_equal(img1.src, img1_src_value = "assets/1/HOME-LOGO_unilab.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "class", "animate__animated animate__fadeInLeft");
    			set_style(img1, "width", "20%");
    			set_style(img1, "margin-left", "5%");
    			set_style(img1, "position", "absolute");
    			set_style(img1, "bottom", "-18%");
    			attr_dev(img1, "alt", "");
    			add_location(img1, file$5, 12, 16, 427);
    			attr_dev(div0, "class", "text-left");
    			add_location(div0, file$5, 11, 12, 385);
    			attr_dev(div1, "class", "col-sm-6 text-center");
    			add_location(div1, file$5, 9, 8, 208);
    			if (!src_url_equal(img2.src, img2_src_value = "assets/1/HOME-LOGO_uap.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "class", "animate__animated animate__fadeInRight");
    			set_style(img2, "width", "15%");
    			set_style(img2, "position", "absolute");
    			set_style(img2, "right", "5%");
    			set_style(img2, "bottom", "-18%");
    			attr_dev(img2, "alt", "");
    			add_location(img2, file$5, 16, 12, 671);
    			attr_dev(div2, "class", "col-sm-6");
    			add_location(div2, file$5, 15, 8, 635);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$5, 8, 4, 181);
    			attr_dev(section, "class", "bg-home");
    			add_location(section, file$5, 6, 0, 148);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, div3);
    			append_dev(div3, div1);
    			append_dev(div1, img0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, img1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, img2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Home', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ fade, slide, scale, fly });
    	return [];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\pages\Action.svelte generated by Svelte v3.47.0 */
    const file$4 = "src\\pages\\Action.svelte";

    // (130:28) {:else}
    function create_else_block_7(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/2/clicked/Inflammation.png ")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "100%");
    			attr_dev(img, "alt", "");
    			add_location(img, file$4, 130, 28, 3028);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_7.name,
    		type: "else",
    		source: "(130:28) {:else}",
    		ctx
    	});

    	return block;
    }

    // (124:28) {#if c1}
    function create_if_block_9(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/2/Default/Inflammation.png ")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "100%");
    			attr_dev(img, "alt", "");
    			add_location(img, file$4, 124, 28, 2757);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(124:28) {#if c1}",
    		ctx
    	});

    	return block;
    }

    // (145:28) {:else}
    function create_else_block_6(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/2/clicked/Allergies.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "100%");
    			attr_dev(img, "alt", "");
    			add_location(img, file$4, 145, 28, 3739);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_6.name,
    		type: "else",
    		source: "(145:28) {:else}",
    		ctx
    	});

    	return block;
    }

    // (139:28) {#if c2}
    function create_if_block_8(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/2/Default/Allergies.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "100%");
    			attr_dev(img, "alt", "");
    			add_location(img, file$4, 139, 28, 3472);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(139:28) {#if c2}",
    		ctx
    	});

    	return block;
    }

    // (160:28) {:else}
    function create_else_block_5(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/2/clicked/Cerebral_edema.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "100%");
    			attr_dev(img, "alt", "");
    			add_location(img, file$4, 160, 28, 4451);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_5.name,
    		type: "else",
    		source: "(160:28) {:else}",
    		ctx
    	});

    	return block;
    }

    // (154:28) {#if c3}
    function create_if_block_7(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/2/Default/Cerebral_edema.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "100%");
    			attr_dev(img, "alt", "");
    			add_location(img, file$4, 154, 28, 4179);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(154:28) {#if c3}",
    		ctx
    	});

    	return block;
    }

    // (177:28) {:else}
    function create_else_block_4(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/2/clicked/Shock.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "100%");
    			attr_dev(img, "alt", "");
    			add_location(img, file$4, 177, 28, 5227);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_4.name,
    		type: "else",
    		source: "(177:28) {:else}",
    		ctx
    	});

    	return block;
    }

    // (171:24) {#if c4}
    function create_if_block_6(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/2/Default/Shock.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "100%");
    			attr_dev(img, "alt", "");
    			add_location(img, file$4, 171, 28, 4965);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(171:24) {#if c4}",
    		ctx
    	});

    	return block;
    }

    // (201:28) {:else}
    function create_else_block_3(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/2/clicked/Asthma.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "100%");
    			attr_dev(img, "alt", "");
    			add_location(img, file$4, 201, 28, 6266);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3.name,
    		type: "else",
    		source: "(201:28) {:else}",
    		ctx
    	});

    	return block;
    }

    // (195:28) {#if c5}
    function create_if_block_5$1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/2/Default/Asthma.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "100%");
    			attr_dev(img, "alt", "");
    			add_location(img, file$4, 195, 28, 6002);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$1.name,
    		type: "if",
    		source: "(195:28) {#if c5}",
    		ctx
    	});

    	return block;
    }

    // (216:28) {:else}
    function create_else_block_2(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/2/clicked/Atopic_and contact_dermatitis.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "100%");
    			attr_dev(img, "alt", "");
    			add_location(img, file$4, 216, 28, 6974);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(216:28) {:else}",
    		ctx
    	});

    	return block;
    }

    // (210:28) {#if c6}
    function create_if_block_4$2(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/2/Default/Atopic_and_contact_dermatitis.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "100%");
    			attr_dev(img, "alt", "");
    			add_location(img, file$4, 210, 28, 6687);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$2.name,
    		type: "if",
    		source: "(210:28) {#if c6}",
    		ctx
    	});

    	return block;
    }

    // (231:28) {:else}
    function create_else_block_1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/2/clicked/Drug_hypersensitivity_reactions.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "100%");
    			attr_dev(img, "alt", "");
    			add_location(img, file$4, 231, 28, 7722);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(231:28) {:else}",
    		ctx
    	});

    	return block;
    }

    // (225:28) {#if c7}
    function create_if_block_3$3(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/2/Default/Drug_hypersensitivity_reactions.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "100%");
    			attr_dev(img, "alt", "");
    			add_location(img, file$4, 225, 28, 7433);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$3.name,
    		type: "if",
    		source: "(225:28) {#if c7}",
    		ctx
    	});

    	return block;
    }

    // (248:28) {:else}
    function create_else_block$2(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/2/clicked/Cushing_disease as_a_diagnostic agent.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "100%");
    			attr_dev(img, "alt", "");
    			add_location(img, file$4, 248, 28, 8548);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(248:28) {:else}",
    		ctx
    	});

    	return block;
    }

    // (242:24) {#if c8}
    function create_if_block_2$3(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/2/Default/Cushing_disease as_a_diagnostic agent.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "100%");
    			attr_dev(img, "alt", "");
    			add_location(img, file$4, 242, 28, 8253);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(242:24) {#if c8}",
    		ctx
    	});

    	return block;
    }

    // (262:4) {#if reference == "closed"}
    function create_if_block_1$4(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let button_intro;
    	let button_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/2/Reference/ACTION-REFERENCE-TAB.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "reference2 svelte-1n5kf0p");
    			attr_dev(img, "alt", "");
    			add_location(img, file$4, 270, 12, 9182);
    			attr_dev(button, "class", "ref2 svelte-1n5kf0p");
    			add_location(button, file$4, 262, 8, 8997);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_8*/ ctx[33], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (button_outro) button_outro.end(1);
    				button_intro = create_in_transition(button, fade, {});
    				button_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (button_intro) button_intro.invalidate();
    			button_outro = create_out_transition(button, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_outro) button_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(262:4) {#if reference == \\\"closed\\\"}",
    		ctx
    	});

    	return block;
    }

    // (278:4) {#if reference == "open"}
    function create_if_block$4(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let button_intro;
    	let button_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/2/Reference/ACTION-REFERENCE-TAB-ACTIVE-WTEXT.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "reference svelte-1n5kf0p");
    			attr_dev(img, "alt", "");
    			add_location(img, file$4, 286, 12, 9642);
    			attr_dev(button, "class", "ref svelte-1n5kf0p");
    			add_location(button, file$4, 278, 8, 9400);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_9*/ ctx[34], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (button_outro) button_outro.end(1);
    				button_intro = create_in_transition(button, fly, { x: 500, duration: 1000 });
    				button_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (button_intro) button_intro.invalidate();
    			button_outro = create_out_transition(button, fly, { x: 500, duration: 1000 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_outro) button_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(278:4) {#if reference == \\\"open\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let t0;
    	let section;
    	let div6;
    	let img0;
    	let img0_src_value;
    	let t1;
    	let div5;
    	let div4;
    	let div1;
    	let img1;
    	let img1_src_value;
    	let t2;
    	let div0;
    	let button0;
    	let t3;
    	let br0;
    	let t4;
    	let button1;
    	let t5;
    	let br1;
    	let t6;
    	let button2;
    	let t7;
    	let br2;
    	let t8;
    	let button3;
    	let t9;
    	let br3;
    	let t10;
    	let div3;
    	let img2;
    	let img2_src_value;
    	let t11;
    	let div2;
    	let button4;
    	let t12;
    	let br4;
    	let t13;
    	let button5;
    	let t14;
    	let br5;
    	let t15;
    	let button6;
    	let t16;
    	let br6;
    	let t17;
    	let button7;
    	let t18;
    	let br7;
    	let t19;
    	let t20;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*c1*/ ctx[1]) return create_if_block_9;
    		return create_else_block_7;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*c2*/ ctx[2]) return create_if_block_8;
    		return create_else_block_6;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	function select_block_type_2(ctx, dirty) {
    		if (/*c3*/ ctx[3]) return create_if_block_7;
    		return create_else_block_5;
    	}

    	let current_block_type_2 = select_block_type_2(ctx);
    	let if_block2 = current_block_type_2(ctx);

    	function select_block_type_3(ctx, dirty) {
    		if (/*c4*/ ctx[4]) return create_if_block_6;
    		return create_else_block_4;
    	}

    	let current_block_type_3 = select_block_type_3(ctx);
    	let if_block3 = current_block_type_3(ctx);

    	function select_block_type_4(ctx, dirty) {
    		if (/*c5*/ ctx[5]) return create_if_block_5$1;
    		return create_else_block_3;
    	}

    	let current_block_type_4 = select_block_type_4(ctx);
    	let if_block4 = current_block_type_4(ctx);

    	function select_block_type_5(ctx, dirty) {
    		if (/*c6*/ ctx[6]) return create_if_block_4$2;
    		return create_else_block_2;
    	}

    	let current_block_type_5 = select_block_type_5(ctx);
    	let if_block5 = current_block_type_5(ctx);

    	function select_block_type_6(ctx, dirty) {
    		if (/*c7*/ ctx[7]) return create_if_block_3$3;
    		return create_else_block_1;
    	}

    	let current_block_type_6 = select_block_type_6(ctx);
    	let if_block6 = current_block_type_6(ctx);

    	function select_block_type_7(ctx, dirty) {
    		if (/*c8*/ ctx[8]) return create_if_block_2$3;
    		return create_else_block$2;
    	}

    	let current_block_type_7 = select_block_type_7(ctx);
    	let if_block7 = current_block_type_7(ctx);
    	let if_block8 = /*reference*/ ctx[0] == "closed" && create_if_block_1$4(ctx);
    	let if_block9 = /*reference*/ ctx[0] == "open" && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			t0 = space();
    			section = element("section");
    			div6 = element("div");
    			img0 = element("img");
    			t1 = space();
    			div5 = element("div");
    			div4 = element("div");
    			div1 = element("div");
    			img1 = element("img");
    			t2 = space();
    			div0 = element("div");
    			button0 = element("button");
    			if_block0.c();
    			t3 = space();
    			br0 = element("br");
    			t4 = space();
    			button1 = element("button");
    			if_block1.c();
    			t5 = space();
    			br1 = element("br");
    			t6 = space();
    			button2 = element("button");
    			if_block2.c();
    			t7 = space();
    			br2 = element("br");
    			t8 = space();
    			button3 = element("button");
    			if_block3.c();
    			t9 = space();
    			br3 = element("br");
    			t10 = space();
    			div3 = element("div");
    			img2 = element("img");
    			t11 = space();
    			div2 = element("div");
    			button4 = element("button");
    			if_block4.c();
    			t12 = space();
    			br4 = element("br");
    			t13 = space();
    			button5 = element("button");
    			if_block5.c();
    			t14 = space();
    			br5 = element("br");
    			t15 = space();
    			button6 = element("button");
    			if_block6.c();
    			t16 = space();
    			br6 = element("br");
    			t17 = space();
    			button7 = element("button");
    			if_block7.c();
    			t18 = space();
    			br7 = element("br");
    			t19 = space();
    			if (if_block8) if_block8.c();
    			t20 = space();
    			if (if_block9) if_block9.c();
    			document.title = "Drenex | Action";
    			if (!src_url_equal(img0.src, img0_src_value = "assets/2/ACTION-HEADER.png")) attr_dev(img0, "src", img0_src_value);
    			set_style(img0, "width", "70%");
    			set_style(img0, "margin-top", "5%");
    			attr_dev(img0, "alt", "");
    			add_location(img0, file$4, 107, 8, 2041);
    			if (!src_url_equal(img1.src, img1_src_value = "assets/2/ACTION-SUBHEADER1.png")) attr_dev(img1, "src", img1_src_value);
    			set_style(img1, "width", "100%");
    			attr_dev(img1, "alt", "");
    			add_location(img1, file$4, 116, 20, 2376);
    			set_style(button0, "width", /*wc1*/ ctx[9]);
    			set_style(button0, "margin-top", "5%");
    			attr_dev(button0, "class", "svelte-1n5kf0p");
    			add_location(button0, file$4, 122, 24, 2619);
    			add_location(br0, file$4, 136, 33, 3302);
    			set_style(button1, "width", /*wc2*/ ctx[10]);
    			set_style(button1, "margin-top", "5%");
    			attr_dev(button1, "class", "svelte-1n5kf0p");
    			add_location(button1, file$4, 137, 24, 3334);
    			add_location(br1, file$4, 151, 33, 4009);
    			set_style(button2, "width", /*wc3*/ ctx[11]);
    			set_style(button2, "margin-top", "5%");
    			attr_dev(button2, "class", "svelte-1n5kf0p");
    			add_location(button2, file$4, 152, 24, 4041);
    			add_location(br2, file$4, 166, 33, 4726);
    			set_style(button3, "width", /*wc4*/ ctx[12]);
    			set_style(button3, "margin-top", "5%");
    			set_style(button3, "margin-bottom", "5%");
    			attr_dev(button3, "class", "svelte-1n5kf0p");
    			add_location(button3, file$4, 167, 24, 4758);
    			add_location(br3, file$4, 183, 33, 5492);
    			set_style(div0, "margin-top", "5%");
    			add_location(div0, file$4, 121, 20, 2565);
    			attr_dev(div1, "class", "col-lg-5 bg1 mr-3 svelte-1n5kf0p");
    			add_location(div1, file$4, 115, 16, 2323);
    			if (!src_url_equal(img2.src, img2_src_value = "assets/2/ACTION-SUBHEADER2.png")) attr_dev(img2, "src", img2_src_value);
    			set_style(img2, "width", "99.5%");
    			attr_dev(img2, "alt", "");
    			add_location(img2, file$4, 187, 20, 5621);
    			set_style(button4, "margin-top", "4%");
    			set_style(button4, "width", /*wc5*/ ctx[13]);
    			attr_dev(button4, "class", "svelte-1n5kf0p");
    			add_location(button4, file$4, 193, 24, 5865);
    			add_location(br4, file$4, 207, 33, 6517);
    			set_style(button5, "margin-top", "4%");
    			set_style(button5, "width", /*wc6*/ ctx[14]);
    			attr_dev(button5, "class", "svelte-1n5kf0p");
    			add_location(button5, file$4, 208, 24, 6549);
    			add_location(br5, file$4, 222, 33, 7264);
    			set_style(button6, "margin-top", "4%");
    			set_style(button6, "width", /*wc7*/ ctx[15]);
    			attr_dev(button6, "class", "svelte-1n5kf0p");
    			add_location(button6, file$4, 223, 24, 7296);
    			add_location(br6, file$4, 237, 33, 8014);
    			set_style(button7, "width", /*wc8*/ ctx[16]);
    			set_style(button7, "margin-top", "4%");
    			set_style(button7, "margin-bottom", "5%");
    			attr_dev(button7, "class", "svelte-1n5kf0p");
    			add_location(button7, file$4, 238, 24, 8046);
    			add_location(br7, file$4, 254, 33, 8846);
    			set_style(div2, "margin-top", "5%");
    			add_location(div2, file$4, 192, 20, 5811);
    			attr_dev(div3, "class", "col-lg-5 bg2 ml-3 svelte-1n5kf0p");
    			add_location(div3, file$4, 186, 16, 5568);
    			attr_dev(div4, "class", "row");
    			set_style(div4, "padding-left", "10%");
    			add_location(div4, file$4, 114, 12, 2261);
    			set_style(div5, "margin-left", "10%");
    			set_style(div5, "margin-right", "10%");
    			set_style(div5, "margin-top", "1%");
    			add_location(div5, file$4, 113, 8, 2183);
    			attr_dev(div6, "class", "text-center");
    			add_location(div6, file$4, 106, 4, 2006);
    			attr_dev(section, "class", "bg-action");
    			add_location(section, file$4, 105, 0, 1973);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, div6);
    			append_dev(div6, img0);
    			append_dev(div6, t1);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div1, img1);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			if_block0.m(button0, null);
    			append_dev(button0, t3);
    			append_dev(div0, br0);
    			append_dev(div0, t4);
    			append_dev(div0, button1);
    			if_block1.m(button1, null);
    			append_dev(button1, t5);
    			append_dev(div0, br1);
    			append_dev(div0, t6);
    			append_dev(div0, button2);
    			if_block2.m(button2, null);
    			append_dev(button2, t7);
    			append_dev(div0, br2);
    			append_dev(div0, t8);
    			append_dev(div0, button3);
    			if_block3.m(button3, null);
    			append_dev(button3, t9);
    			append_dev(div0, br3);
    			append_dev(div4, t10);
    			append_dev(div4, div3);
    			append_dev(div3, img2);
    			append_dev(div3, t11);
    			append_dev(div3, div2);
    			append_dev(div2, button4);
    			if_block4.m(button4, null);
    			append_dev(button4, t12);
    			append_dev(div2, br4);
    			append_dev(div2, t13);
    			append_dev(div2, button5);
    			if_block5.m(button5, null);
    			append_dev(button5, t14);
    			append_dev(div2, br5);
    			append_dev(div2, t15);
    			append_dev(div2, button6);
    			if_block6.m(button6, null);
    			append_dev(button6, t16);
    			append_dev(div2, br6);
    			append_dev(div2, t17);
    			append_dev(div2, button7);
    			if_block7.m(button7, null);
    			append_dev(button7, t18);
    			append_dev(div2, br7);
    			append_dev(section, t19);
    			if (if_block8) if_block8.m(section, null);
    			append_dev(section, t20);
    			if (if_block9) if_block9.m(section, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[25], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[26], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[27], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[28], false, false, false),
    					listen_dev(button4, "click", /*click_handler_4*/ ctx[29], false, false, false),
    					listen_dev(button5, "click", /*click_handler_5*/ ctx[30], false, false, false),
    					listen_dev(button6, "click", /*click_handler_6*/ ctx[31], false, false, false),
    					listen_dev(button7, "click", /*click_handler_7*/ ctx[32], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(button0, t3);
    				}
    			}

    			if (!current || dirty[0] & /*wc1*/ 512) {
    				set_style(button0, "width", /*wc1*/ ctx[9]);
    			}

    			if (current_block_type_1 !== (current_block_type_1 = select_block_type_1(ctx))) {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(button1, t5);
    				}
    			}

    			if (!current || dirty[0] & /*wc2*/ 1024) {
    				set_style(button1, "width", /*wc2*/ ctx[10]);
    			}

    			if (current_block_type_2 !== (current_block_type_2 = select_block_type_2(ctx))) {
    				if_block2.d(1);
    				if_block2 = current_block_type_2(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(button2, t7);
    				}
    			}

    			if (!current || dirty[0] & /*wc3*/ 2048) {
    				set_style(button2, "width", /*wc3*/ ctx[11]);
    			}

    			if (current_block_type_3 !== (current_block_type_3 = select_block_type_3(ctx))) {
    				if_block3.d(1);
    				if_block3 = current_block_type_3(ctx);

    				if (if_block3) {
    					if_block3.c();
    					if_block3.m(button3, t9);
    				}
    			}

    			if (!current || dirty[0] & /*wc4*/ 4096) {
    				set_style(button3, "width", /*wc4*/ ctx[12]);
    			}

    			if (current_block_type_4 !== (current_block_type_4 = select_block_type_4(ctx))) {
    				if_block4.d(1);
    				if_block4 = current_block_type_4(ctx);

    				if (if_block4) {
    					if_block4.c();
    					if_block4.m(button4, t12);
    				}
    			}

    			if (!current || dirty[0] & /*wc5*/ 8192) {
    				set_style(button4, "width", /*wc5*/ ctx[13]);
    			}

    			if (current_block_type_5 !== (current_block_type_5 = select_block_type_5(ctx))) {
    				if_block5.d(1);
    				if_block5 = current_block_type_5(ctx);

    				if (if_block5) {
    					if_block5.c();
    					if_block5.m(button5, t14);
    				}
    			}

    			if (!current || dirty[0] & /*wc6*/ 16384) {
    				set_style(button5, "width", /*wc6*/ ctx[14]);
    			}

    			if (current_block_type_6 !== (current_block_type_6 = select_block_type_6(ctx))) {
    				if_block6.d(1);
    				if_block6 = current_block_type_6(ctx);

    				if (if_block6) {
    					if_block6.c();
    					if_block6.m(button6, t16);
    				}
    			}

    			if (!current || dirty[0] & /*wc7*/ 32768) {
    				set_style(button6, "width", /*wc7*/ ctx[15]);
    			}

    			if (current_block_type_7 !== (current_block_type_7 = select_block_type_7(ctx))) {
    				if_block7.d(1);
    				if_block7 = current_block_type_7(ctx);

    				if (if_block7) {
    					if_block7.c();
    					if_block7.m(button7, t18);
    				}
    			}

    			if (!current || dirty[0] & /*wc8*/ 65536) {
    				set_style(button7, "width", /*wc8*/ ctx[16]);
    			}

    			if (/*reference*/ ctx[0] == "closed") {
    				if (if_block8) {
    					if_block8.p(ctx, dirty);

    					if (dirty[0] & /*reference*/ 1) {
    						transition_in(if_block8, 1);
    					}
    				} else {
    					if_block8 = create_if_block_1$4(ctx);
    					if_block8.c();
    					transition_in(if_block8, 1);
    					if_block8.m(section, t20);
    				}
    			} else if (if_block8) {
    				group_outros();

    				transition_out(if_block8, 1, 1, () => {
    					if_block8 = null;
    				});

    				check_outros();
    			}

    			if (/*reference*/ ctx[0] == "open") {
    				if (if_block9) {
    					if_block9.p(ctx, dirty);

    					if (dirty[0] & /*reference*/ 1) {
    						transition_in(if_block9, 1);
    					}
    				} else {
    					if_block9 = create_if_block$4(ctx);
    					if_block9.c();
    					transition_in(if_block9, 1);
    					if_block9.m(section, null);
    				}
    			} else if (if_block9) {
    				group_outros();

    				transition_out(if_block9, 1, 1, () => {
    					if_block9 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block8);
    			transition_in(if_block9);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block8);
    			transition_out(if_block9);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(section);
    			if_block0.d();
    			if_block1.d();
    			if_block2.d();
    			if_block3.d();
    			if_block4.d();
    			if_block5.d();
    			if_block6.d();
    			if_block7.d();
    			if (if_block8) if_block8.d();
    			if (if_block9) if_block9.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Action', slots, []);
    	let reference = "closed";
    	let c1 = true;
    	let c2 = true;
    	let c3 = true;
    	let c4 = true;
    	let c5 = true;
    	let c6 = true;
    	let c7 = true;
    	let c8 = true;
    	let wc1 = "10%";
    	let wc2 = "10%";
    	let wc3 = "10%";
    	let wc4 = "10%";
    	let wc5 = "12.5%";
    	let wc6 = "10.2%";
    	let wc7 = "10.2%";
    	let wc8 = "10.2%";

    	function ck1() {
    		if (c1 == true) {
    			$$invalidate(1, c1 = false);
    			$$invalidate(9, wc1 = "40%");
    		} else {
    			$$invalidate(1, c1 = true);
    			$$invalidate(9, wc1 = "10%");
    		}
    	}

    	function ck2() {
    		if (c2 == true) {
    			$$invalidate(2, c2 = false);
    			$$invalidate(10, wc2 = "31%");
    		} else {
    			$$invalidate(2, c2 = true);
    			$$invalidate(10, wc2 = "10%");
    		}
    	}

    	function ck3() {
    		if (c3 == true) {
    			$$invalidate(3, c3 = false);
    			$$invalidate(11, wc3 = "41%");
    		} else {
    			$$invalidate(3, c3 = true);
    			$$invalidate(11, wc3 = "10%");
    		}
    	}

    	function ck4() {
    		if (c4 == true) {
    			$$invalidate(4, c4 = false);
    			$$invalidate(12, wc4 = "26%");
    		} else {
    			$$invalidate(4, c4 = true);
    			$$invalidate(12, wc4 = "10%");
    		}
    	}

    	function ck5() {
    		if (c5 == true) {
    			$$invalidate(5, c5 = false);
    			$$invalidate(13, wc5 = "30%");
    		} else {
    			$$invalidate(5, c5 = true);
    			$$invalidate(13, wc5 = "12.5%");
    		}
    	}

    	function ck6() {
    		if (c6 == true) {
    			$$invalidate(6, c6 = false);
    			$$invalidate(14, wc6 = "39%");
    		} else {
    			$$invalidate(6, c6 = true);
    			$$invalidate(14, wc6 = "10.2%");
    		}
    	}

    	function ck7() {
    		if (c7 == true) {
    			$$invalidate(7, c7 = false);
    			$$invalidate(15, wc7 = "44%");
    		} else {
    			$$invalidate(7, c7 = true);
    			$$invalidate(15, wc7 = "10.2%");
    		}
    	}

    	function ck8() {
    		if (c8 == true) {
    			$$invalidate(8, c8 = false);
    			$$invalidate(16, wc8 = "44%");
    		} else {
    			$$invalidate(8, c8 = true);
    			$$invalidate(16, wc8 = "10.2%");
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Action> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		ck1();
    	};

    	const click_handler_1 = () => {
    		ck2();
    	};

    	const click_handler_2 = () => {
    		ck3();
    	};

    	const click_handler_3 = () => {
    		ck4();
    	};

    	const click_handler_4 = () => {
    		ck5();
    	};

    	const click_handler_5 = () => {
    		ck6();
    	};

    	const click_handler_6 = () => {
    		ck7();
    	};

    	const click_handler_7 = () => {
    		ck8();
    	};

    	const click_handler_8 = () => {
    		$$invalidate(0, reference = "open");
    	};

    	const click_handler_9 = () => {
    		$$invalidate(0, reference = "closed");
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		slide,
    		scale,
    		fly,
    		reference,
    		c1,
    		c2,
    		c3,
    		c4,
    		c5,
    		c6,
    		c7,
    		c8,
    		wc1,
    		wc2,
    		wc3,
    		wc4,
    		wc5,
    		wc6,
    		wc7,
    		wc8,
    		ck1,
    		ck2,
    		ck3,
    		ck4,
    		ck5,
    		ck6,
    		ck7,
    		ck8
    	});

    	$$self.$inject_state = $$props => {
    		if ('reference' in $$props) $$invalidate(0, reference = $$props.reference);
    		if ('c1' in $$props) $$invalidate(1, c1 = $$props.c1);
    		if ('c2' in $$props) $$invalidate(2, c2 = $$props.c2);
    		if ('c3' in $$props) $$invalidate(3, c3 = $$props.c3);
    		if ('c4' in $$props) $$invalidate(4, c4 = $$props.c4);
    		if ('c5' in $$props) $$invalidate(5, c5 = $$props.c5);
    		if ('c6' in $$props) $$invalidate(6, c6 = $$props.c6);
    		if ('c7' in $$props) $$invalidate(7, c7 = $$props.c7);
    		if ('c8' in $$props) $$invalidate(8, c8 = $$props.c8);
    		if ('wc1' in $$props) $$invalidate(9, wc1 = $$props.wc1);
    		if ('wc2' in $$props) $$invalidate(10, wc2 = $$props.wc2);
    		if ('wc3' in $$props) $$invalidate(11, wc3 = $$props.wc3);
    		if ('wc4' in $$props) $$invalidate(12, wc4 = $$props.wc4);
    		if ('wc5' in $$props) $$invalidate(13, wc5 = $$props.wc5);
    		if ('wc6' in $$props) $$invalidate(14, wc6 = $$props.wc6);
    		if ('wc7' in $$props) $$invalidate(15, wc7 = $$props.wc7);
    		if ('wc8' in $$props) $$invalidate(16, wc8 = $$props.wc8);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		reference,
    		c1,
    		c2,
    		c3,
    		c4,
    		c5,
    		c6,
    		c7,
    		c8,
    		wc1,
    		wc2,
    		wc3,
    		wc4,
    		wc5,
    		wc6,
    		wc7,
    		wc8,
    		ck1,
    		ck2,
    		ck3,
    		ck4,
    		ck5,
    		ck6,
    		ck7,
    		ck8,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8,
    		click_handler_9
    	];
    }

    class Action extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Action",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\pages\Efficacy.svelte generated by Svelte v3.47.0 */
    const file$3 = "src\\pages\\Efficacy.svelte";

    // (53:8) {:else}
    function create_else_block$1(ctx) {
    	let button0;
    	let img0;
    	let img0_src_value;
    	let t;
    	let button1;
    	let img1;
    	let img1_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			img0 = element("img");
    			t = space();
    			button1 = element("button");
    			img1 = element("img");
    			if (!src_url_equal(img0.src, img0_src_value = "assets/3/default/EFFICACY-CONTENT-1-DEFAULT.png")) attr_dev(img0, "src", img0_src_value);
    			set_style(img0, "width", "100%");
    			set_style(img0, "margin-top", "5%");
    			attr_dev(img0, "alt", "");
    			add_location(img0, file$3, 60, 16, 1713);
    			set_style(button0, "width", "70%");
    			attr_dev(button0, "class", "hovEfficacy svelte-h84aac");
    			add_location(button0, file$3, 53, 12, 1509);
    			if (!src_url_equal(img1.src, img1_src_value = "assets/3/default/EFFICACY-CONTENT-2-DEFAULT.png")) attr_dev(img1, "src", img1_src_value);
    			set_style(img1, "width", "100%");
    			set_style(img1, "margin-top", "5%");
    			attr_dev(img1, "alt", "");
    			add_location(img1, file$3, 73, 16, 2138);
    			set_style(button1, "width", "70%");
    			attr_dev(button1, "class", "hovEfficacy svelte-h84aac");
    			add_location(button1, file$3, 66, 12, 1934);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			append_dev(button0, img0);
    			insert_dev(target, t, anchor);
    			insert_dev(target, button1, anchor);
    			append_dev(button1, img1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[8], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(button1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(53:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (38:8) {#if modalshow}
    function create_if_block_4$1(ctx) {
    	let button0;
    	let img0;
    	let img0_src_value;
    	let t;
    	let button1;
    	let img1;
    	let img1_src_value;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			img0 = element("img");
    			t = space();
    			button1 = element("button");
    			img1 = element("img");
    			if (!src_url_equal(img0.src, img0_src_value = "assets/3/clicked/EFFICACY-CONTENT-2-DEFAULT-BLUR.png")) attr_dev(img0, "src", img0_src_value);
    			set_style(img0, "width", "100%");
    			set_style(img0, "margin-top", "5%");
    			attr_dev(img0, "alt", "");
    			add_location(img0, file$3, 39, 16, 994);
    			set_style(button0, "width", "70%");
    			attr_dev(button0, "class", "svelte-h84aac");
    			add_location(button0, file$3, 38, 12, 948);
    			if (!src_url_equal(img1.src, img1_src_value = "assets/3/clicked/EFFICACY-CONTENT-1-DEFAULT-BLUR.png")) attr_dev(img1, "src", img1_src_value);
    			set_style(img1, "width", "100%");
    			set_style(img1, "margin-top", "5%");
    			attr_dev(img1, "alt", "");
    			add_location(img1, file$3, 46, 16, 1266);
    			set_style(button1, "width", "70%");
    			attr_dev(button1, "class", "svelte-h84aac");
    			add_location(button1, file$3, 45, 12, 1220);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			append_dev(button0, img0);
    			insert_dev(target, t, anchor);
    			insert_dev(target, button1, anchor);
    			append_dev(button1, img1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(button1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(38:8) {#if modalshow}",
    		ctx
    	});

    	return block;
    }

    // (84:8) {#if modal1}
    function create_if_block_3$2(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let button_intro;
    	let button_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/3/clicked/EFFICACY-CONTENT-1-CLICKED.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "100%");
    			attr_dev(img, "alt", "");
    			add_location(img, file$3, 92, 16, 2637);
    			attr_dev(button, "class", "modal-efficacy svelte-h84aac");
    			add_location(button, file$3, 84, 12, 2424);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_2*/ ctx[10], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (button_outro) button_outro.end(1);
    				button_intro = create_in_transition(button, fade, {});
    				button_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (button_intro) button_intro.invalidate();
    			button_outro = create_out_transition(button, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_outro) button_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$2.name,
    		type: "if",
    		source: "(84:8) {#if modal1}",
    		ctx
    	});

    	return block;
    }

    // (101:8) {#if modal2}
    function create_if_block_2$2(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let button_intro;
    	let button_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/3/clicked/EFFICACY-CONTENT-2-CLICKED.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "100%");
    			attr_dev(img, "alt", "");
    			add_location(img, file$3, 109, 16, 3095);
    			attr_dev(button, "class", "modal-efficacy svelte-h84aac");
    			add_location(button, file$3, 101, 12, 2882);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_3*/ ctx[11], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (button_outro) button_outro.end(1);
    				button_intro = create_in_transition(button, fade, {});
    				button_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (button_intro) button_intro.invalidate();
    			button_outro = create_out_transition(button, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_outro) button_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(101:8) {#if modal2}",
    		ctx
    	});

    	return block;
    }

    // (120:4) {#if reference == "closed"}
    function create_if_block_1$3(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let button_intro;
    	let button_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/2/Reference/ACTION-REFERENCE-TAB.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "reference2 svelte-h84aac");
    			attr_dev(img, "alt", "");
    			add_location(img, file$3, 128, 12, 3572);
    			attr_dev(button, "class", "ref2 svelte-h84aac");
    			add_location(button, file$3, 120, 8, 3387);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_4*/ ctx[12], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (button_outro) button_outro.end(1);
    				button_intro = create_in_transition(button, fade, {});
    				button_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (button_intro) button_intro.invalidate();
    			button_outro = create_out_transition(button, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_outro) button_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(120:4) {#if reference == \\\"closed\\\"}",
    		ctx
    	});

    	return block;
    }

    // (136:4) {#if reference == "open"}
    function create_if_block$3(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let button_intro;
    	let button_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/3/reference/EFFICACY-REFERENCE-TAB-ACTIVE-wtext.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "reference svelte-h84aac");
    			attr_dev(img, "alt", "");
    			add_location(img, file$3, 144, 12, 4032);
    			attr_dev(button, "class", "ref svelte-h84aac");
    			add_location(button, file$3, 136, 8, 3790);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_5*/ ctx[13], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (button_outro) button_outro.end(1);
    				button_intro = create_in_transition(button, fly, { x: 500, duration: 1000 });
    				button_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (button_intro) button_intro.invalidate();
    			button_outro = create_out_transition(button, fly, { x: 500, duration: 1000 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_outro) button_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(136:4) {#if reference == \\\"open\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let t0;
    	let section;
    	let div;
    	let img;
    	let img_src_value;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let section_class_value;
    	let current;

    	function select_block_type(ctx, dirty) {
    		if (/*modalshow*/ ctx[4]) return create_if_block_4$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*modal1*/ ctx[2] && create_if_block_3$2(ctx);
    	let if_block2 = /*modal2*/ ctx[3] && create_if_block_2$2(ctx);
    	let if_block3 = /*reference*/ ctx[0] == "closed" && create_if_block_1$3(ctx);
    	let if_block4 = /*reference*/ ctx[0] == "open" && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			t0 = space();
    			section = element("section");
    			div = element("div");
    			img = element("img");
    			t1 = space();
    			if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			if (if_block2) if_block2.c();
    			t4 = space();
    			if (if_block3) if_block3.c();
    			t5 = space();
    			if (if_block4) if_block4.c();
    			document.title = "Drenex | EFFICACY";
    			if (!src_url_equal(img.src, img_src_value = "assets/3/EFFICACY-HEADER.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "40%");
    			set_style(img, "margin-top", "5%");
    			attr_dev(img, "alt", "");
    			add_location(img, file$3, 32, 8, 777);
    			attr_dev(div, "class", "text-center");
    			add_location(div, file$3, 31, 4, 742);
    			attr_dev(section, "class", section_class_value = "" + (null_to_empty(/*bg_efficacy*/ ctx[1]) + " svelte-h84aac"));
    			add_location(section, file$3, 30, 0, 707);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, div);
    			append_dev(div, img);
    			append_dev(div, t1);
    			if_block0.m(div, null);
    			append_dev(div, t2);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t3);
    			if (if_block2) if_block2.m(div, null);
    			append_dev(section, t4);
    			if (if_block3) if_block3.m(section, null);
    			append_dev(section, t5);
    			if (if_block4) if_block4.m(section, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div, t2);
    				}
    			}

    			if (/*modal1*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*modal1*/ 4) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_3$2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, t3);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*modal2*/ ctx[3]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*modal2*/ 8) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_2$2(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*reference*/ ctx[0] == "closed") {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty & /*reference*/ 1) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_1$3(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(section, t5);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (/*reference*/ ctx[0] == "open") {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty & /*reference*/ 1) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block$3(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(section, null);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*bg_efficacy*/ 2 && section_class_value !== (section_class_value = "" + (null_to_empty(/*bg_efficacy*/ ctx[1]) + " svelte-h84aac"))) {
    				attr_dev(section, "class", section_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(if_block4);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(section);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Efficacy', slots, []);
    	let reference = "closed";
    	let bg_efficacy = "bg-efficacy";
    	let modal1 = false;
    	let modal2 = false;
    	let modalshow = false;

    	function modalshow1() {
    		$$invalidate(1, bg_efficacy = "bg-efficacy-blur");
    		$$invalidate(2, modal1 = true);
    		$$invalidate(4, modalshow = true);
    	}

    	function modalshow2() {
    		$$invalidate(1, bg_efficacy = "bg-efficacy-blur");
    		$$invalidate(3, modal2 = true);
    		$$invalidate(4, modalshow = true);
    	}

    	function closeModal() {
    		$$invalidate(1, bg_efficacy = "bg-efficacy");
    		$$invalidate(2, modal1 = false);
    		$$invalidate(3, modal2 = false);
    		$$invalidate(4, modalshow = false);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Efficacy> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		modalshow1();
    	};

    	const click_handler_1 = () => {
    		modalshow2();
    	};

    	const click_handler_2 = () => {
    		closeModal();
    	};

    	const click_handler_3 = () => {
    		closeModal();
    	};

    	const click_handler_4 = () => {
    		$$invalidate(0, reference = "open");
    	};

    	const click_handler_5 = () => {
    		$$invalidate(0, reference = "closed");
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		fly,
    		reference,
    		bg_efficacy,
    		modal1,
    		modal2,
    		modalshow,
    		modalshow1,
    		modalshow2,
    		closeModal
    	});

    	$$self.$inject_state = $$props => {
    		if ('reference' in $$props) $$invalidate(0, reference = $$props.reference);
    		if ('bg_efficacy' in $$props) $$invalidate(1, bg_efficacy = $$props.bg_efficacy);
    		if ('modal1' in $$props) $$invalidate(2, modal1 = $$props.modal1);
    		if ('modal2' in $$props) $$invalidate(3, modal2 = $$props.modal2);
    		if ('modalshow' in $$props) $$invalidate(4, modalshow = $$props.modalshow);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		reference,
    		bg_efficacy,
    		modal1,
    		modal2,
    		modalshow,
    		modalshow1,
    		modalshow2,
    		closeModal,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5
    	];
    }

    class Efficacy extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Efficacy",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\pages\Bioavailability.svelte generated by Svelte v3.47.0 */
    const file$2 = "src\\pages\\Bioavailability.svelte";

    // (23:16) {#if modalShow == false}
    function create_if_block_3$1(ctx) {
    	let img0;
    	let img0_src_value;
    	let t;
    	let button;
    	let img1;
    	let img1_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			img0 = element("img");
    			t = space();
    			button = element("button");
    			img1 = element("img");
    			if (!src_url_equal(img0.src, img0_src_value = "assets/4/BIOA-HEADER.png")) attr_dev(img0, "src", img0_src_value);
    			set_style(img0, "width", "75%");
    			attr_dev(img0, "alt", "");
    			add_location(img0, file$2, 23, 16, 698);
    			if (!src_url_equal(img1.src, img1_src_value = "assets/4/default/BIOA-CONTENT-DEFAULT.png")) attr_dev(img1, "src", img1_src_value);
    			set_style(img1, "margin-top", "5%");
    			set_style(img1, "width", "100%");
    			attr_dev(img1, "alt", "");
    			add_location(img1, file$2, 29, 24, 968);
    			set_style(button, "width", "100%");
    			attr_dev(button, "class", "hoverBio svelte-j6emr0");
    			add_location(button, file$2, 28, 20, 865);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img0, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, button, anchor);
    			append_dev(button, img1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img0);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(23:16) {#if modalShow == false}",
    		ctx
    	});

    	return block;
    }

    // (42:4) {#if modalShow}
    function create_if_block_2$1(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let button_intro;
    	let button_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/4/clicked/BIOA-CONTENT-CLICKED.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "100%");
    			attr_dev(img, "alt", "");
    			add_location(img, file$2, 43, 8, 1428);
    			attr_dev(button, "class", "modal-bio svelte-j6emr0");
    			add_location(button, file$2, 42, 4, 1343);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (button_outro) button_outro.end(1);
    				button_intro = create_in_transition(button, fade, {});
    				button_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (button_intro) button_intro.invalidate();
    			button_outro = create_out_transition(button, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_outro) button_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(42:4) {#if modalShow}",
    		ctx
    	});

    	return block;
    }

    // (52:4) {#if reference == "closed"}
    function create_if_block_1$2(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let button_intro;
    	let button_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/2/Reference/ACTION-REFERENCE-TAB.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "reference2 svelte-j6emr0");
    			attr_dev(img, "alt", "");
    			add_location(img, file$2, 60, 12, 1815);
    			attr_dev(button, "class", "ref2 svelte-j6emr0");
    			add_location(button, file$2, 52, 8, 1630);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_2*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (button_outro) button_outro.end(1);
    				button_intro = create_in_transition(button, fade, {});
    				button_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (button_intro) button_intro.invalidate();
    			button_outro = create_out_transition(button, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_outro) button_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(52:4) {#if reference == \\\"closed\\\"}",
    		ctx
    	});

    	return block;
    }

    // (68:4) {#if reference == "open"}
    function create_if_block$2(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let button_intro;
    	let button_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/4/references/BIOA-REFERENCE-TAB-ACTIVE-WTEXT.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "reference svelte-j6emr0");
    			attr_dev(img, "alt", "");
    			add_location(img, file$2, 76, 12, 2275);
    			attr_dev(button, "class", "ref svelte-j6emr0");
    			add_location(button, file$2, 68, 8, 2033);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_3*/ ctx[8], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (button_outro) button_outro.end(1);
    				button_intro = create_in_transition(button, fly, { x: 500, duration: 1000 });
    				button_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (button_intro) button_intro.invalidate();
    			button_outro = create_out_transition(button, fly, { x: 500, duration: 1000 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_outro) button_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(68:4) {#if reference == \\\"open\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let t0;
    	let section;
    	let div3;
    	let div1;
    	let div0;
    	let t1;
    	let div2;
    	let t2;
    	let t3;
    	let t4;
    	let section_class_value;
    	let current;
    	let if_block0 = /*modalShow*/ ctx[2] == false && create_if_block_3$1(ctx);
    	let if_block1 = /*modalShow*/ ctx[2] && create_if_block_2$1(ctx);
    	let if_block2 = /*reference*/ ctx[0] == "closed" && create_if_block_1$2(ctx);
    	let if_block3 = /*reference*/ ctx[0] == "open" && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			t0 = space();
    			section = element("section");
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t1 = space();
    			div2 = element("div");
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			if (if_block2) if_block2.c();
    			t4 = space();
    			if (if_block3) if_block3.c();
    			document.title = "Drenex | BIOAVAILABILITY";
    			set_style(div0, "margin", "10%");
    			add_location(div0, file$2, 21, 12, 612);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$2, 20, 8, 576);
    			attr_dev(div2, "class", "col-sm-6");
    			add_location(div2, file$2, 38, 8, 1278);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$2, 19, 4, 549);
    			attr_dev(section, "class", section_class_value = "" + (null_to_empty(/*bg_bioavailability*/ ctx[1]) + " svelte-j6emr0"));
    			add_location(section, file$2, 18, 0, 507);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, div3);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(section, t2);
    			if (if_block1) if_block1.m(section, null);
    			append_dev(section, t3);
    			if (if_block2) if_block2.m(section, null);
    			append_dev(section, t4);
    			if (if_block3) if_block3.m(section, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*modalShow*/ ctx[2] == false) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3$1(ctx);
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*modalShow*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*modalShow*/ 4) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_2$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(section, t3);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*reference*/ ctx[0] == "closed") {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*reference*/ 1) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_1$2(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(section, t4);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*reference*/ ctx[0] == "open") {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty & /*reference*/ 1) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block$2(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(section, null);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*bg_bioavailability*/ 2 && section_class_value !== (section_class_value = "" + (null_to_empty(/*bg_bioavailability*/ ctx[1]) + " svelte-j6emr0"))) {
    				attr_dev(section, "class", section_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(section);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Bioavailability', slots, []);
    	let reference = "closed";
    	let bg_bioavailability = "bg-bioavailability";
    	let modalShow = false;

    	function showModal() {
    		$$invalidate(1, bg_bioavailability = "bg-bioavailability-blur");
    		$$invalidate(2, modalShow = true);
    	}

    	function closeModal() {
    		$$invalidate(1, bg_bioavailability = "bg-bioavailability");
    		$$invalidate(2, modalShow = false);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Bioavailability> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		showModal();
    	};

    	const click_handler_1 = () => {
    		closeModal();
    	};

    	const click_handler_2 = () => {
    		$$invalidate(0, reference = "open");
    	};

    	const click_handler_3 = () => {
    		$$invalidate(0, reference = "closed");
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		slide,
    		scale,
    		fly,
    		reference,
    		bg_bioavailability,
    		modalShow,
    		showModal,
    		closeModal
    	});

    	$$self.$inject_state = $$props => {
    		if ('reference' in $$props) $$invalidate(0, reference = $$props.reference);
    		if ('bg_bioavailability' in $$props) $$invalidate(1, bg_bioavailability = $$props.bg_bioavailability);
    		if ('modalShow' in $$props) $$invalidate(2, modalShow = $$props.modalShow);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		reference,
    		bg_bioavailability,
    		modalShow,
    		showModal,
    		closeModal,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class Bioavailability extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Bioavailability",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\pages\Covid19.svelte generated by Svelte v3.47.0 */
    const file$1 = "src\\pages\\Covid19.svelte";

    // (68:8) {:else}
    function create_else_block(ctx) {
    	let button0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let button1;
    	let img1;
    	let img1_src_value;
    	let button1_intro;
    	let t1;
    	let button2;
    	let img2;
    	let img2_src_value;
    	let button2_intro;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			img0 = element("img");
    			t0 = space();
    			button1 = element("button");
    			img1 = element("img");
    			t1 = space();
    			button2 = element("button");
    			img2 = element("img");
    			if (!src_url_equal(img0.src, img0_src_value = "assets/5/default/COVID19-CONTENT-1-DEFAULT.png")) attr_dev(img0, "src", img0_src_value);
    			set_style(img0, "width", "100%");
    			attr_dev(img0, "alt", "");
    			add_location(img0, file$1, 74, 16, 2051);
    			attr_dev(button0, "class", "c19 hovCovid svelte-1vloheq");
    			add_location(button0, file$1, 68, 12, 1882);
    			if (!src_url_equal(img1.src, img1_src_value = "assets/5/default/COVID19-CONTENT-2-DEFAULT.png")) attr_dev(img1, "src", img1_src_value);
    			set_style(img1, "width", "100%");
    			attr_dev(img1, "alt", "");
    			add_location(img1, file$1, 87, 16, 2450);
    			attr_dev(button1, "class", "c19 hovCovid svelte-1vloheq");
    			add_location(button1, file$1, 80, 12, 2256);
    			if (!src_url_equal(img2.src, img2_src_value = "assets/5/default/COVID19-CONTENT-3-DEFAULT.png")) attr_dev(img2, "src", img2_src_value);
    			set_style(img2, "width", "100%");
    			attr_dev(img2, "alt", "");
    			add_location(img2, file$1, 100, 16, 2849);
    			attr_dev(button2, "class", "c19 hovCovid svelte-1vloheq");
    			add_location(button2, file$1, 93, 12, 2655);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			append_dev(button0, img0);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button1, anchor);
    			append_dev(button1, img1);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button2, anchor);
    			append_dev(button2, img2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[10], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[11], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[12], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (!button1_intro) {
    				add_render_callback(() => {
    					button1_intro = create_in_transition(button1, fade, {});
    					button1_intro.start();
    				});
    			}

    			if (!button2_intro) {
    				add_render_callback(() => {
    					button2_intro = create_in_transition(button2, fade, {});
    					button2_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(68:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (44:8) {#if modalShow}
    function create_if_block_5(ctx) {
    	let button0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let button1;
    	let img1;
    	let img1_src_value;
    	let t1;
    	let button2;
    	let img2;
    	let img2_src_value;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			img0 = element("img");
    			t0 = space();
    			button1 = element("button");
    			img1 = element("img");
    			t1 = space();
    			button2 = element("button");
    			img2 = element("img");
    			if (!src_url_equal(img0.src, img0_src_value = "assets/5/clicked/COVID19-CONTENT-1-DEFAULT-BLUR.png")) attr_dev(img0, "src", img0_src_value);
    			set_style(img0, "width", "100%");
    			attr_dev(img0, "alt", "");
    			add_location(img0, file$1, 45, 16, 1155);
    			attr_dev(button0, "class", "c19 svelte-1vloheq");
    			add_location(button0, file$1, 44, 12, 1117);
    			if (!src_url_equal(img1.src, img1_src_value = "assets/5/clicked/COVID19-CONTENT-2-DEFAULT-BLUR.png")) attr_dev(img1, "src", img1_src_value);
    			set_style(img1, "width", "100%");
    			attr_dev(img1, "alt", "");
    			add_location(img1, file$1, 53, 16, 1405);
    			attr_dev(button1, "class", "c19 svelte-1vloheq");
    			add_location(button1, file$1, 52, 12, 1367);
    			if (!src_url_equal(img2.src, img2_src_value = "assets/5/clicked/COVID19-CONTENT-3-DEFAULT-BLUR.png")) attr_dev(img2, "src", img2_src_value);
    			set_style(img2, "width", "100%");
    			attr_dev(img2, "alt", "");
    			add_location(img2, file$1, 61, 16, 1655);
    			attr_dev(button2, "class", "c19 svelte-1vloheq");
    			add_location(button2, file$1, 60, 12, 1617);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			append_dev(button0, img0);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button1, anchor);
    			append_dev(button1, img1);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button2, anchor);
    			append_dev(button2, img2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(44:8) {#if modalShow}",
    		ctx
    	});

    	return block;
    }

    // (113:4) {#if modal1}
    function create_if_block_4(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let button_intro;
    	let button_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/5/clicked/COVID19-CONTENT-1-CLICKED.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "100%");
    			attr_dev(img, "alt", "");
    			add_location(img, file$1, 121, 12, 3326);
    			attr_dev(button, "class", "modal-covid svelte-1vloheq");
    			add_location(button, file$1, 113, 8, 3140);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_3*/ ctx[13], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (button_outro) button_outro.end(1);
    				button_intro = create_in_transition(button, fade, {});
    				button_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (button_intro) button_intro.invalidate();
    			button_outro = create_out_transition(button, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_outro) button_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(113:4) {#if modal1}",
    		ctx
    	});

    	return block;
    }

    // (131:4) {#if modal2}
    function create_if_block_3(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let button_intro;
    	let button_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/5/clicked/COVID19-CONTENT-2-CLICKED.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "100%");
    			attr_dev(img, "alt", "");
    			add_location(img, file$1, 139, 12, 3745);
    			attr_dev(button, "class", "modal-covid svelte-1vloheq");
    			add_location(button, file$1, 131, 8, 3559);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_4*/ ctx[14], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (button_outro) button_outro.end(1);
    				button_intro = create_in_transition(button, fade, {});
    				button_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (button_intro) button_intro.invalidate();
    			button_outro = create_out_transition(button, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_outro) button_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(131:4) {#if modal2}",
    		ctx
    	});

    	return block;
    }

    // (149:4) {#if modal3}
    function create_if_block_2(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let button_intro;
    	let button_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/5/clicked/COVID19-CONTENT-3-CLICKED.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "100%");
    			attr_dev(img, "alt", "");
    			add_location(img, file$1, 157, 12, 4164);
    			attr_dev(button, "class", "modal-covid svelte-1vloheq");
    			add_location(button, file$1, 149, 8, 3978);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_5*/ ctx[15], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (button_outro) button_outro.end(1);
    				button_intro = create_in_transition(button, fade, {});
    				button_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (button_intro) button_intro.invalidate();
    			button_outro = create_out_transition(button, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_outro) button_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(149:4) {#if modal3}",
    		ctx
    	});

    	return block;
    }

    // (168:4) {#if reference == "closed"}
    function create_if_block_1$1(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let button_intro;
    	let button_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/2/Reference/ACTION-REFERENCE-TAB.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "reference2 svelte-1vloheq");
    			attr_dev(img, "alt", "");
    			add_location(img, file$1, 176, 12, 4602);
    			attr_dev(button, "class", "ref2 svelte-1vloheq");
    			add_location(button, file$1, 168, 8, 4417);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_6*/ ctx[16], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (button_outro) button_outro.end(1);
    				button_intro = create_in_transition(button, fade, {});
    				button_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (button_intro) button_intro.invalidate();
    			button_outro = create_out_transition(button, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_outro) button_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(168:4) {#if reference == \\\"closed\\\"}",
    		ctx
    	});

    	return block;
    }

    // (184:4) {#if reference == "open"}
    function create_if_block$1(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let button_intro;
    	let button_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/5/references/COVID19-REFERENCE-TAB-ACTIVE-WTEXT.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "reference svelte-1vloheq");
    			attr_dev(img, "alt", "");
    			add_location(img, file$1, 192, 12, 5062);
    			attr_dev(button, "class", "ref svelte-1vloheq");
    			add_location(button, file$1, 184, 8, 4820);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_7*/ ctx[17], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (button_outro) button_outro.end(1);
    				button_intro = create_in_transition(button, fly, { x: 500, duration: 1000 });
    				button_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (button_intro) button_intro.invalidate();
    			button_outro = create_out_transition(button, fly, { x: 500, duration: 1000 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_outro) button_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(184:4) {#if reference == \\\"open\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let t0;
    	let section;
    	let div;
    	let img;
    	let img_src_value;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let section_class_value;
    	let current;

    	function select_block_type(ctx, dirty) {
    		if (/*modalShow*/ ctx[5]) return create_if_block_5;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*modal1*/ ctx[2] && create_if_block_4(ctx);
    	let if_block2 = /*modal2*/ ctx[3] && create_if_block_3(ctx);
    	let if_block3 = /*modal3*/ ctx[4] && create_if_block_2(ctx);
    	let if_block4 = /*reference*/ ctx[0] == "closed" && create_if_block_1$1(ctx);
    	let if_block5 = /*reference*/ ctx[0] == "open" && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			t0 = space();
    			section = element("section");
    			div = element("div");
    			img = element("img");
    			t1 = space();
    			if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			if (if_block2) if_block2.c();
    			t4 = space();
    			if (if_block3) if_block3.c();
    			t5 = space();
    			if (if_block4) if_block4.c();
    			t6 = space();
    			if (if_block5) if_block5.c();
    			document.title = "Drenex | COVID-19";
    			if (!src_url_equal(img.src, img_src_value = "assets/5/COVID19-HEADER.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "75%");
    			set_style(img, "margin-top", "4%");
    			attr_dev(img, "alt", "");
    			add_location(img, file$1, 38, 8, 947);
    			attr_dev(div, "class", "text-center");
    			add_location(div, file$1, 37, 4, 912);
    			attr_dev(section, "class", section_class_value = "" + (null_to_empty(/*bg_covid*/ ctx[1]) + " svelte-1vloheq"));
    			add_location(section, file$1, 36, 0, 878);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, div);
    			append_dev(div, img);
    			append_dev(div, t1);
    			if_block0.m(div, null);
    			append_dev(section, t2);
    			if (if_block1) if_block1.m(section, null);
    			append_dev(section, t3);
    			if (if_block2) if_block2.m(section, null);
    			append_dev(section, t4);
    			if (if_block3) if_block3.m(section, null);
    			append_dev(section, t5);
    			if (if_block4) if_block4.m(section, null);
    			append_dev(section, t6);
    			if (if_block5) if_block5.m(section, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div, null);
    				}
    			}

    			if (/*modal1*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*modal1*/ 4) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_4(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(section, t3);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*modal2*/ ctx[3]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*modal2*/ 8) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_3(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(section, t4);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*modal3*/ ctx[4]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty & /*modal3*/ 16) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_2(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(section, t5);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (/*reference*/ ctx[0] == "closed") {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty & /*reference*/ 1) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_1$1(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(section, t6);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}

    			if (/*reference*/ ctx[0] == "open") {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);

    					if (dirty & /*reference*/ 1) {
    						transition_in(if_block5, 1);
    					}
    				} else {
    					if_block5 = create_if_block$1(ctx);
    					if_block5.c();
    					transition_in(if_block5, 1);
    					if_block5.m(section, null);
    				}
    			} else if (if_block5) {
    				group_outros();

    				transition_out(if_block5, 1, 1, () => {
    					if_block5 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*bg_covid*/ 2 && section_class_value !== (section_class_value = "" + (null_to_empty(/*bg_covid*/ ctx[1]) + " svelte-1vloheq"))) {
    				attr_dev(section, "class", section_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(if_block4);
    			transition_in(if_block5);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			transition_out(if_block5);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(section);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Covid19', slots, []);
    	let reference = "closed";
    	let bg_covid = "bg-covid19";
    	let modal1 = false;
    	let modal2 = false;
    	let modal3 = false;
    	let modalShow = false;

    	function covidModal1() {
    		$$invalidate(2, modal1 = true);
    		$$invalidate(5, modalShow = true);
    		$$invalidate(1, bg_covid = "bg-covid19-blur");
    	}

    	function covidModal2() {
    		$$invalidate(3, modal2 = true);
    		$$invalidate(5, modalShow = true);
    		$$invalidate(1, bg_covid = "bg-covid19-blur");
    	}

    	function covidModal3() {
    		$$invalidate(4, modal3 = true);
    		$$invalidate(5, modalShow = true);
    		$$invalidate(1, bg_covid = "bg-covid19-blur");
    	}

    	function closeModal() {
    		$$invalidate(2, modal1 = false);
    		$$invalidate(3, modal2 = false);
    		$$invalidate(4, modal3 = false);
    		$$invalidate(5, modalShow = false);
    		$$invalidate(1, bg_covid = "bg-covid19");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Covid19> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		covidModal1();
    	};

    	const click_handler_1 = () => {
    		covidModal2();
    	};

    	const click_handler_2 = () => {
    		covidModal3();
    	};

    	const click_handler_3 = () => {
    		closeModal();
    	};

    	const click_handler_4 = () => {
    		closeModal();
    	};

    	const click_handler_5 = () => {
    		closeModal();
    	};

    	const click_handler_6 = () => {
    		$$invalidate(0, reference = "open");
    	};

    	const click_handler_7 = () => {
    		$$invalidate(0, reference = "closed");
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		slide,
    		scale,
    		fly,
    		reference,
    		bg_covid,
    		modal1,
    		modal2,
    		modal3,
    		modalShow,
    		covidModal1,
    		covidModal2,
    		covidModal3,
    		closeModal
    	});

    	$$self.$inject_state = $$props => {
    		if ('reference' in $$props) $$invalidate(0, reference = $$props.reference);
    		if ('bg_covid' in $$props) $$invalidate(1, bg_covid = $$props.bg_covid);
    		if ('modal1' in $$props) $$invalidate(2, modal1 = $$props.modal1);
    		if ('modal2' in $$props) $$invalidate(3, modal2 = $$props.modal2);
    		if ('modal3' in $$props) $$invalidate(4, modal3 = $$props.modal3);
    		if ('modalShow' in $$props) $$invalidate(5, modalShow = $$props.modalShow);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		reference,
    		bg_covid,
    		modal1,
    		modal2,
    		modal3,
    		modalShow,
    		covidModal1,
    		covidModal2,
    		covidModal3,
    		closeModal,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7
    	];
    }

    class Covid19 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Covid19",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\pages\Dosage.svelte generated by Svelte v3.47.0 */
    const file = "src\\pages\\Dosage.svelte";

    // (24:4) {#if reference == "closed"}
    function create_if_block_1(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let button_intro;
    	let button_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/2/Reference/ACTION-REFERENCE-TAB.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "reference2 svelte-ydo36i");
    			attr_dev(img, "alt", "");
    			add_location(img, file, 25, 8, 744);
    			attr_dev(button, "class", "ref2 svelte-ydo36i");
    			add_location(button, file, 24, 4, 657);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (button_outro) button_outro.end(1);
    				button_intro = create_in_transition(button, fade, {});
    				button_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (button_intro) button_intro.invalidate();
    			button_outro = create_out_transition(button, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_outro) button_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(24:4) {#if reference == \\\"closed\\\"}",
    		ctx
    	});

    	return block;
    }

    // (33:4) {#if reference == "open"}
    function create_if_block(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let button_intro;
    	let button_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "assets/6/References/DOSAGE-REFERENCE-TAB-ACTIVE-wtext.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "reference svelte-ydo36i");
    			attr_dev(img, "alt", "");
    			add_location(img, file, 34, 8, 1070);
    			attr_dev(button, "class", "ref svelte-ydo36i");
    			add_location(button, file, 33, 4, 922);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (button_outro) button_outro.end(1);
    				button_intro = create_in_transition(button, fly, { x: 500, duration: 1000 });
    				button_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (button_intro) button_intro.invalidate();
    			button_outro = create_out_transition(button, fly, { x: 500, duration: 1000 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching && button_outro) button_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(33:4) {#if reference == \\\"open\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let t0;
    	let section;
    	let div3;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t1;
    	let div2;
    	let div1;
    	let img1;
    	let img1_src_value;
    	let t2;
    	let t3;
    	let current;
    	let if_block0 = /*reference*/ ctx[0] == "closed" && create_if_block_1(ctx);
    	let if_block1 = /*reference*/ ctx[0] == "open" && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			t0 = space();
    			section = element("section");
    			div3 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");
    			img1 = element("img");
    			t2 = space();
    			if (if_block0) if_block0.c();
    			t3 = space();
    			if (if_block1) if_block1.c();
    			document.title = "Drenex | DOSAGE";
    			if (!src_url_equal(img0.src, img0_src_value = "assets/6/final.png")) attr_dev(img0, "src", img0_src_value);
    			set_style(img0, "width", "80%");
    			attr_dev(img0, "alt", "");
    			add_location(img0, file, 11, 12, 291);
    			attr_dev(div0, "class", "col-sm-6 text-center");
    			add_location(div0, file, 10, 8, 243);
    			if (!src_url_equal(img1.src, img1_src_value = "assets/6/DOSAGE-CONTENT_2.png")) attr_dev(img1, "src", img1_src_value);
    			set_style(img1, "width", "50%");
    			set_style(img1, "position", "absolute");
    			set_style(img1, "bottom", "0");
    			set_style(img1, "left", "0");
    			set_style(img1, "right", "0");
    			set_style(img1, "margin", "0 auto");
    			attr_dev(img1, "alt", "");
    			add_location(img1, file, 15, 16, 433);
    			add_location(div1, file, 14, 12, 410);
    			attr_dev(div2, "class", "col-sm-6");
    			add_location(div2, file, 13, 8, 374);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file, 9, 4, 216);
    			attr_dev(section, "class", "bg-dosage");
    			add_location(section, file, 7, 0, 181);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, div3);
    			append_dev(div3, div0);
    			append_dev(div0, img0);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, img1);
    			append_dev(section, t2);
    			if (if_block0) if_block0.m(section, null);
    			append_dev(section, t3);
    			if (if_block1) if_block1.m(section, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*reference*/ ctx[0] == "closed") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*reference*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(section, t3);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*reference*/ ctx[0] == "open") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*reference*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(section, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(section);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Dosage', slots, []);
    	let reference = "closed";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Dosage> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(0, reference = "open");
    	};

    	const click_handler_1 = () => {
    		$$invalidate(0, reference = "closed");
    	};

    	$$self.$capture_state = () => ({ fade, slide, scale, fly, reference });

    	$$self.$inject_state = $$props => {
    		if ('reference' in $$props) $$invalidate(0, reference = $$props.reference);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [reference, click_handler, click_handler_1];
    }

    class Dosage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dosage",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.47.0 */

    function create_fragment(ctx) {
    	let router;
    	let t;
    	let nav;
    	let current;

    	router = new Router({
    			props: { routes: /*routes*/ ctx[0] },
    			$$inline: true
    		});

    	nav = new Nav({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    			t = space();
    			create_component(nav.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(nav, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			transition_in(nav.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			transition_out(nav.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(nav, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const password = "123";

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let bind_password = "";

    	const routes = {
    		"/": Home,
    		"/action": Action,
    		"/efficacy": Efficacy,
    		"/bio": Bioavailability,
    		"/covid19": Covid19,
    		"/dosage": Dosage
    	}; // '*': NotFound

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Router,
    		Nav,
    		Home,
    		Action,
    		Efficacy,
    		Bioavailability,
    		Covid19,
    		Dosage,
    		password,
    		bind_password,
    		routes
    	});

    	$$self.$inject_state = $$props => {
    		if ('bind_password' in $$props) bind_password = $$props.bind_password;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [routes];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.getElementById('app')
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
