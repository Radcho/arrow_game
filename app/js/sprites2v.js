// sprites.js library by Lubomir Salanci
// version 24. 11. 2016
// posledna uprava 3. 10. 2018
"use strict";

var activities = [];

// Sprite class:

function Sprite(activity, appearance, x, y, behavior)
{
    var i;
    x = Math.round(x);
    y = Math.round(y);
    this.activity = activity;
    this.idx = activity.sprites.length;
    this.x = x;
    this.y = y;
    this.homeX = x;
    this.homeY = y;
    this.place = null;
    this.item = null;
    this.image = null;
    this.images = [];
    this.highlight = null;
    this.behavior = behavior;
    activity.sprites.push(this);
    if (!(appearance instanceof Array)) this.loadImage(appearance);
    else
        for (i = 0; i < appearance.length; i++) this.loadImage(appearance[i]);
}

Sprite.prototype.loadImage = function(source)
{
    var activity, image;
    if (source instanceof Image)
    {
        sprite.images.push(source);
        if (sprite.image == null) sprite.image = source;
        return;
    } 
    activity = this.activity;
    image = new Image();
    image.crossOrigin = 'anonymous';
    function done(event)
    {
        activity.loading--;
        activity.animate();
    }
    function error(event)
    {
        done();
        alert("Error loading image: " + event.target.src);
    }
    function load(src, err)
    {
        image.onerror = err;
        image.src = src;
    }
    image.onload = done;
    this.images.push(image);
    if (this.image == null) this.image = image;
    activity.loading++;
    if (typeof source === "string" || !(source instanceof Object) || source.data === undefined && source.file === undefined) load(source, error);
    else if (source.data === undefined) load(source.file, error);
    else if (source.file === undefined) load(source.data, error);
    else load(source.data, function() {load(source.file, error);});
}

Sprite.prototype.erase = function()
{
    var i;
    i = this.activity.sprites.indexOf(this);
    if (i >= 0) this.activity.sprites.splice(i, 1);
    if (clicking == this) clicking = null;
    if (dragging == this) dragging = null;
    if (this.place != null) 
    {
        if (!(this.place.item instanceof Array)) this.place.item = null;
        else this.place.item.splice(this.place.item.indexOf(this), 1);
        this.place = null;       
    }
    if (this.item != null)
    {
        if (!(this.item instanceof Array)) this.item.place = null;
        else
            for (i = 0; i < this.item.length; i++)
                this.item[i].place = null;
        this.item = null;
    }
}

Sprite.prototype.saveState = function()
{
    var i, state;
    state = "";
    if (this.x != this.homeX) state = state + " x = " + this.x.toString() + ";";
    if (this.y != this.homeY) state = state + " y = " + this.y.toString() + ";";
    if (this.image != this.images[0])
        state = state + " img = " + this.images.indexOf(this.image).toString() + ";";
    if (this.highlight != null)
        state = state + " highlight = " + this.highlight + ";";
    if (this.item != null)
        if (!(this.item instanceof Array)) state = state + " item = " + this.item.idx.toString();
        else
        {
            state = state + " item = [";
            if (this.item.length > 0)
            {
                state = state + this.item[0].idx.toString();
                for (i = 1; i < this.item.length; i++)
                    state = state + ", " + this.item[i].idx.toString();
            }
            state = state + "];";
        }
    return state;
}

Sprite.prototype.loadState = function(state)
{
    var settings, namevalue, ids, sprite;
    var i, s, n;
    settings = state.split(";");
    for (s = 0; s < settings.length; s++)
    {
        namevalue = settings[s].split("=");
        if (namevalue.length >= 2)
            switch (namevalue[0].trim())
            {
                case "x":
                    this.x = parseInt(namevalue[1]);
                    break;
                case "y":
                    this.y = parseInt(namevalue[1]);
                    break;
                case "img":
                    this.image = this.images[parseInt(namevalue[1])];
                    break;
                case "highlight":
                    this.highlight = namevalue[1].trim();
                    break;
                case "item":
                    ids = namevalue[1].trim();
                    if (ids != "")
                        if (ids[0] != "[" || ids[ids.length - 1] != "]")
                        {
                            sprite = this.activity.sprites[parseInt(ids)];
                            this.item = sprite;
                            sprite.place = this;
                        }
                        else
                        {
                            ids = ids.substring(1, ids.length - 1).split(",");
                            this.item = [];
                            for (i = 0; i < ids.length; i++)
                                if (ids[i] != "")
                                {
                                    sprite = this.activity.sprites[parseInt(ids[i])];
                                    this.item.push(sprite);
                                    sprite.place = this;
                                }
                        }
                    break;
            }
    }
}

Sprite.prototype.__defineGetter__("left", function()
{
    return this.x - Math.round(this.image.width / 2);
});

Sprite.prototype.__defineGetter__("top", function()
{
    return this.y - Math.round(this.image.height / 2);
});

Sprite.prototype.__defineGetter__("right", function()
{
    return this.x - Math.round(this.image.width / 2) + this.image.width;
});

Sprite.prototype.__defineGetter__("bottom", function()
{
    return this.y - Math.round(this.image.height / 2) + this.image.height;
});

Sprite.prototype.__defineGetter__("width", function()
{
    return this.image.width;
});

Sprite.prototype.__defineGetter__("height", function()
{
    return this.image.height;
});

Sprite.prototype.isIn = function(x, y)
{
    var l, t, r, b;
    l = this.x - Math.round(this.image.width / 2);
    t = this.y - Math.round(this.image.height / 2);
    r = l + this.image.width;
    b = t + this.image.height;
    return l <= x && t <= y && x < r && y < b;
}

Sprite.prototype.isOverRect = function(x, y, w, h)
{
    return x <= this.x && y <= this.y && this.x < x + w && this.y < y + h;
}

Sprite.prototype.findOverlapped = function(sprites)
{
    var i, sprite;
    if (sprites === undefined) list = this.activity.sprites;
    for (i = sprites.length - 1; i >= 0; i--)
    {
        sprite = sprites[i];
        if (sprite != this && sprite.isIn(this.x, this.y)) return sprite;
    }
    return null;
}

Sprite.prototype.contains = function(sprite)
{
    while (sprite != null)
    {
        if (sprite == this) return true;
        sprite = sprite.place;
    }
    return false;
}

Sprite.prototype.bringToFront = function(behind)
{
    var a, l, r, i, j, k;
    if (behind === undefined) behind = null;
    if (behind == null && this.item == null && this.activity.sprites[this.activity.sprites.length - 1] == this) return;
    a = [];
    l = 0;
    r = this.activity.sprites.length;
    while (l < r && this.activity.sprites[l] != behind && !this.contains(this.activity.sprites[l])) l++;
    i = l;
    while (i < r && this.activity.sprites[i] != behind)
    {
        if (this.contains(this.activity.sprites[i])) a.push(this.activity.sprites[i]);
        else
        {
            this.activity.sprites[l] = this.activity.sprites[i];
            l++;
        }
        i++;
    }
    while (r > l && this.contains(this.activity.sprites[r - 1])) r--;
    j = r;
    while (j > i)
    {
        j--;
        if (this.contains(this.activity.sprites[j])) a.push(this.activity.sprites[j]);
        else
        {
            r--;
            this.activity.sprites[r] = this.activity.sprites[j];
        }
    }
    k = 0;
    while (l < i)
    {
        this.activity.sprites[l] = a[k];
        l++;
        k++;
    }
    while (j < r)
    {
        r--;
        this.activity.sprites[r] = a[k];
        k++;
    }
}

Sprite.prototype.getFinalX = function()
{
    var m, p, w;
    if (this.place == null) return this.homeX;
    if (!(this.place.item instanceof Array)) return this.place.x;
    w = this.width;
    p = this.place.width;
    if (w >= p) return this.place.x;
    m = this.place.x - Math.round(p / 2) + Math.round(w / 2);
    if (this.x < m) return m;
    m = m + p - w;
    if (this.x > m) return m;
    return this.x;
}

Sprite.prototype.getFinalY = function()
{
    var m, p, h;
    if (this.place == null) return this.homeY;
    if (!(this.place.item instanceof Array)) return this.place.y;
    h = this.height;
    p = this.place.height;
    if (h >= p) return this.place.y;
    m = this.place.y - Math.round(p / 2) + Math.round(h / 2);
    if (this.y < m) return m;
    m = m + p - h;
    if (this.y > m) return m;
    return this.y;
}

Sprite.prototype.setXY = function(x, y)
{
    var i, dx, dy;
    if (this.x == x && this.y == y) return;
    if (this.item == null)
    {
        this.x = x;
        this.y = y;
    }
    else
    {
        dx = x - this.x;
        dy = y - this.y;
        this.x = x;
        this.y = y;
        if (!(this.item instanceof Array)) this.item.setXY(this.item.x + dx, this.item.y + dy);
        else                 
            for (i = 0; i < this.item.length; i++) 
                this.item[i].setXY(this.item[i].x + dx, this.item[i].y + dy);
    }
}

Sprite.prototype.move = function()
{
    var x, y;
    x = this.getFinalX();
    y = this.getFinalY();
    function step(pos, final)
    {
        if (pos < final)
        {
            pos = Math.round((7 * pos + final) / 8);
            pos = pos + 1;
            if (pos > final) pos = final;
        
        }
        if (pos > final)
        {
            pos = Math.round((7 * pos + final) / 8);
            pos = pos - 1;
            if (pos < final) pos = final;
        }
        return pos;
    }  
    this.setXY(step(this.x, x), step(this.y, y));
    return this.x != x || this.y != y;
}

Sprite.prototype.paint = function(context)
{
    var x, y;
    x = this.left;
    y = this.top;
    context.drawImage(this.image, x, y);
    if (this.highlight != null)
    {
        context.lineWidth = 2;
        context.strokeStyle = this.highlight;
        context.strokeRect(x - 1, y - 1, this.image.width + 2, this.image.height + 2);
    }
}

Sprite.prototype.test = function(mouseX, mouseY)
{
    var c, t;
    if (!this.isIn(mouseX, mouseY)) return false;
    c = document.createElement("canvas");
    c.width = 1;
    c.height = 1;
    t = c.getContext("2d");
    t.drawImage(this.image, this.left - mouseX, this.top - mouseY);
    return t.getImageData(0, 0, 1, 1).data[3] > 0;
}

Sprite.prototype.setHome = function(homeX, homeY)
{
    if (homeX === undefined) this.homeX = this.x;
    else this.homeX = homeX;
    if (homeY === undefined) this.homeY = this.y; 
    else this.homeY = homeY;
}

Sprite.prototype.placeAt = function(target)
{
    var i;
    if (this.place != null) 
        if (!(this.place.item instanceof Array)) this.place.item = null;
        else this.place.item.splice(this.place.item.indexOf(this), 1);
    if (target != null) 
    {
        if (target.item != null) 
            if (!(target.item instanceof Array)) 
            {
                target.item.bringToFront(this);
                target.item.placeAt(this.place);
            }
            else
                for (i = 0; i < target.item.length; i++) 
                {
                    target.item[i].place = null;
                    target.item[i].bringToFront(this);
                }
        target.item = this;
    }
    this.place = target;
}

Sprite.prototype.placeInto = function(target)
{
    if (this.place != null)
        if (!(this.place.item instanceof Array)) this.place.item = null;
        else this.place.item.splice(this.place.item.indexOf(this), 1);
    if (target != null)
    {
        if (target.item == null) target.item = [];
        else 
            if (!(target.item instanceof Array)) target.item = [target.item];
        target.item.push(this);
    }
    this.place = target;
}


// Activity class:

var windowLoaded = false;

function Activity(canvas, enabled)
{    
    this.animating = false;
    this.canvas = canvas;
    this.context = null;
    this.enabled = enabled;
    this.loading = 0;
    this.sprites = [];
    this.onClick = null;
    this.onDragTake = null;
    this.onDragMove = null;
    this.onDragDrop = null;
    this.onPaintBackground = null;
    this.onPaintForeground = null;
	this.onAnimation = null;		//3.10.18
	this.initialState = "";         // PT: pridal som
    activities.push(this);
    if (windowLoaded) this.setup();
}

// PT: pridal begin
Activity.prototype.saveInitialState = function () {
    this.initialState = this.saveState()
}
// PT: pridal end

Activity.prototype.setup = function(activity)
{
    var activity;
    if (typeof this.canvas == "string") this.canvas = document.getElementById(this.canvas);
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    if (this.enabled)
    {
        activity = this;
        this.canvas.addEventListener("mousedown", function(event){activity.mouseDown(event);});
        this.canvas.addEventListener("mousemove", function(event){activity.mouseMove(event);});
        this.canvas.addEventListener("mouseup", function(event){activity.mouseUp(event);});
        this.canvas.addEventListener("touchstart", function(event){activity.touchStart(event);}, false);
        this.canvas.addEventListener("touchmove", function(event){activity.touchMove(event);}, false);
        this.canvas.addEventListener("touchend", function(event){activity.touchEndCancel(event);}, false)
        this.canvas.addEventListener("touchcancel", function(event){activity.touchEndCancel(event);}, false)
    }
    this.context = this.canvas.getContext("2d");
    this.animate();
}

Activity.prototype.saveState = function()
{
    var i, s, state, sprite;
    state = "";
    for (i = 0; i < this.sprites.length; i++)
    {
        sprite = this.sprites[i];
        s = sprite.saveState();
        if (s != "" || sprite.idx != i)
        {
            if (state != "") state = state + "|";
            state = state + "[" + i +"] = " + sprite.idx.toString();
            if (s != "") state = state + ":" + s;
        }
    }
    if (state == this.initialState) state = "";
    return state;
}

Activity.prototype.loadState = function(state)
{
    var items, item, id;
    var sprite, order;
    var i, n;
    if (state === undefined || state == null || state == "" || state == "null") state = this.initialState;  // PT: pridal som
    dragging = null;
    clicking = null;
    order = [];
    for (i = 0; i < this.sprites.length; i++) order[this.sprites[i].idx] = this.sprites[i];
    for (i = 0; i < this.sprites.length; i++)
    {
        sprite = order[i];
        sprite.x = sprite.homeX;
        sprite.y = sprite.homeY;
        sprite.image = sprite.images[0];
        sprite.highlight = null;
        sprite.place = null;
        sprite.item = null;
        this.sprites[i] = sprite;
    }   
    items = state.split("|");
    for (i = 0; i < items.length; i++)
    {
        item = items[i].split(":", 2);
        id = item[0].split("=", 2);
        if (id.length >= 2)
        {
            n = id[0].trim();
            n = parseInt(n.substring(1, n.length - 1));
            order[n] = this.sprites[parseInt(id[1])];
            if (item.length >= 2) order[n].loadState(item[1]);
        }
    }
    this.sprites = order;
    this.animate();
}

// click, drag & drop:

var clicking = null, dragging = null, lastX = 0, lastY = 0;

Activity.prototype.performStart = function(x, y)
{
    var i, rect;
    rect = this.canvas.getBoundingClientRect();
    x = Math.round(x - rect.left);
    y = Math.round(y - rect.top);
    if (clicking == this) clicking = null;
    if (dragging == this) dragging = null;
    i = this.sprites.length - 1;
    while (i >= 0 && !this.sprites[i].test(x, y)) i--;
    if (i < 0 || this.sprites[i].behavior == null) return false;
    this.sprites[i].behavior(this.sprites[i], x, y);
    return true;
}

Activity.prototype.performMove = function(x, y)
{
    var rect;
    rect = this.canvas.getBoundingClientRect();
    x = Math.round(x - rect.left);
    y = Math.round(y - rect.top);
    if (clicking != null)
    {
        if (Math.abs(x - lastX) > clicking.width / 4 || Math.abs(y - lastY) > clicking.height / 4)
        {
            dragging = clicking;
            clicking = null;
            dragging.bringToFront();
            if (this.onDragTake != null) this.onDragTake(dragging);
        }
    }
    if (dragging != null)
    {            
        dragging.setXY(dragging.x + x - lastX, dragging.y + y - lastY);
        lastX = x;
        lastY = y;
        if (this.onDragMove != null) this.onDragMove(dragging);
    }
    this.animate();
}

function performEnd()
{
    if (clicking != null) 
    {
        if (clicking.activity.onClick != null) clicking.activity.onClick(clicking);
        clicking.activity.animate();
        clicking = null;
    }
    if (dragging != null) 
    {
        if (dragging.activity.onDragDrop != null) dragging.activity.onDragDrop(dragging);
        dragging.activity.animate();
        dragging = null;
    }
}

// Sprite behavior:

function clickSprite(sprite, x, y)
{
    if (clicking != null || dragging != null) performEnd();
    if (sprite.activity.onClick != null) sprite.activity.onClick(sprite);
    sprite.activity.animate();
}

function dragSprite(sprite, x, y)
{
    if (clicking != null || dragging != null) performEnd();
    dragging = sprite;
    lastX = x;
    lastY = y;
    sprite.bringToFront();
    if (sprite.activity.onDragTake != null) sprite.activity.onDragTake(sprite);
    sprite.activity.animate();
}

function clickDragSprite(sprite, x, y)
{
    if (clicking != null || dragging != null) performEnd();
    clicking = sprite;
    lastX = x;
    lastY = y;
    sprite.activity.animate();
}

// mouse events:

Activity.prototype.mouseDown = function(event)
{
    if (this.loading != 0) return;
    this.performStart(event.clientX, event.clientY);
    if (clicking != null || dragging != null) this.canvas.setCapture();
}

Activity.prototype.mouseMove = function(event)
{
    var rect;
    if (this.loading != 0) return;
    if (clicking == null && dragging == null) return;
    rect = this.canvas.getBoundingClientRect();
    this.performMove(event.clientX, event.clientY);
    if (event.buttons == 0 && (clicking != null || dragging != null)) performEnd();
}

Activity.prototype.mouseUp = function(event)
{
    if (this.loading != 0) return;
    if (clicking != null || dragging != null) performEnd();
}

// touch events:

var touchFirstId = null;

Activity.prototype.touchStart = function(event)
{
    var touch;
    if (this.loading != 0 || event.changedTouches.length != 1) return;
    touch = event.changedTouches[0];
    touchFirstId = touch.identifier;
    if (this.performStart(touch.clientX, touch.clientY)) event.preventDefault();
}

Activity.prototype.touchMove = function(event)
{
    var i, touch;
    if (this.loading != 0) return;
    if (clicking == null && dragging == null) return;
    for (i = 0; i < event.changedTouches.length; i++)
    {
        touch = event.changedTouches[i];
        if (touch.identifier == touchFirstId)
        {
            this.performMove(touch.clientX, touch.clientY);
            event.preventDefault();
        }
    }
}

Activity.prototype.touchEndCancel = function(event)
{
    var i, touch;
    if (this.loading != 0) return;
    if (clicking == null && dragging == null) return;
    for (i = 0; i < event.changedTouches.length; i++)
    {
        touch = event.changedTouches[i];
        if (touch.identifier == touchFirstId)
        {
            performEnd();
            touchFirstId = null;
        }
    }
}

// animation & painting:

Activity.prototype.move = function()
{
    var i, sprite, changed;
    for (i = 0; i < this.sprites.length; i++)
    {
        sprite = this.sprites[i];
        if (dragging != sprite && sprite.move()) changed = true;
    }
    return changed
}

Activity.prototype.paint = function()
{
    var i;
    if (!windowLoaded || this.loading != 0) return;
    if (this.onPaintBackground != null) this.onPaintBackground(this.context);
    else
    {
        this.context.fillStyle="#FFFFFF";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    if (this.loading == 0)
        for (i = 0; i < this.sprites.length; i++)
            this.sprites[i].paint(this.context);
    if (this.onPaintForeground != null) this.onPaintForeground(this.context);
}

var isAnimateRequest = false;

Activity.prototype.animate = function()
{
    if (!windowLoaded || this.loading != 0 || this.animating) return;
    this.animating = true;
    if (isAnimateRequest) return;
    isAnimateRequest = true;
    requestAnimationFrame(function()
    {
        var i, activity;
        isAnimateRequest = false;
        for (i = 0; i < activities.length; i++)
        {
            activity = activities[i];
            if (activity.animating)
            {
                activity.animating = false;				
                if (activity.move()) activity.animate(); 
				if (activity.onAnimation != null) activity.onAnimation();//3.10.18
                activity.paint();
            }
        }
    });
}

// window events:

function windowLoad()
{
    var i;
    windowLoaded = true;
    window.addEventListener("resize", windowResize, false);
    for (i = 0; i < activities.length; i++) 
        activities[i].setup();
}

function windowResize()
{
    var i, activity;
    if (!windowLoaded) return;
    for (i = 0; i < activities.length; i++)
    {
        activity = activities[i];
        activity.canvas.width = activity.canvas.offsetWidth;
        activity.canvas.height = activity.canvas.offsetHeight;
        activity.paint();
    }
}

window.addEventListener("load", windowLoad, false);

