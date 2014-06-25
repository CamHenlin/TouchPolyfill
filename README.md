Touch Polyfill
===
this is a javascript polyfill that adds touch functionality to browsers with pointer functionality, mainly that piece of trash internet explorer mobile.

Why?
---
I have a multitouch HTML5 game that I've been working on. I got a Windows Phone and realized that my game seemed to work fine in IE mobile other than the fact that it wouldn't respond to touch events at all. I realized that Microsoft had decided to support an alternate type of touch events called pointer events, WTF? I reached out to the Microsoft @ie account on Twitter, and two Internet Explorer program managers responded that I should simply write my game using pointer events and use a Microsoft-supported JavaScript polyfill, hand.js, to support pointerevents on Safari and the Android browsers. Basically, Microsoft is arguing that JavaScript developers should use their low-marketshare implementation of mobile touch, and polyfill their functionality into the two browsers with the highest marketshare. Thereby *increasing* the page execution time for the majority of your non-Windows Phone and tablet users, and trying to force web developers into learning the Microsoft way of doing things in a web browser rather than the defacto standard of touch events.

I was sickened by Microsoft's trying to force us into using pointerevents, so I created this project to allow developers to use touchevents on multitouch devices running Internet Explorer. So now you're polyfilling functionality into the browser with low marketshare that does things in a stupid way.

Usage
===

Include touchpolyfill.js or touchpolyfill.min.js on your page and keep using touch events on the worst mobile browser.

Demo
===
You can view a demo of of Touch Polyfill in action at http://executive-man.com/

trouble?
---
Please let me know if you're having any issues with this project -- I've only done some basic testing on a Lumia 925 on Windows Phone 8.1 so I definitely need testers and bug reports.