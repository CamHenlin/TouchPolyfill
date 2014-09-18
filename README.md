Touch Polyfill
===
This is a JavaScript polyfill that adds touchevent functionality to browsers with pointerevent functionality, Internet Explorer 10 and 11.

Why?
===
I have a multitouch HTML5 game that I've been working on. I got a Windows Phone and realized that my game seemed to work fine in IE mobile other than the fact that it wouldn't respond to touchevents at all. I realized that Microsoft had decided to support an alternate type of touch events called pointerevents! I reached out to the Microsoft @ie account on Twitter, and two Internet Explorer program managers responded that I should simply write my game using pointer events and use a Microsoft-supported JavaScript polyfill, hand.js, to support pointerevents on Safari and the Android browsers. Basically, Microsoft is arguing that JavaScript developers should use their low-marketshare implementation of mobile touch, and polyfill their functionality into the two browsers with the highest marketshare. That didn't really seem right so this polyfill was born.

For further thoughts on Internet Explorer's lack of touchevents, see this article by one of the developers of the polyfill: [IE: The Gift that Keeps on Giving](http://danielsadventure.info/touch/iegift.html)

Usage
===
Include touchpolyfill.js or touchpolyfill.min.js on your page and keep using touch events on the worst mobile browser.

Demo
===
You can view a functional demo of the touch polyfill at: [demo](http://henlin.org/touchpolyfill/demo.html)

People Using Touch Polyfill
===
[HTML5 Fractal Playground](http://danielsadventure.info/html5fractal/docs/intro.html)

[Executive Man](http://executive-man.com/)

Do you have a project using touchpolyfill? Let us know and we'll get you on the list!


Trouble?
===
Please let us know if you're having any issues with this project -- we're looking to make the web a better place so we need testers and bug reports.