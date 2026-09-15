'use strict';
(() => {
 const motionButton=document.querySelector('.motion-toggle');
 if(!window.gsap||!window.ScrollTrigger)return;
 gsap.registerPlugin(ScrollTrigger);
 const systemMotion=matchMedia('(prefers-reduced-motion: reduce)');
 let userReduced=false,media,liquidDisabled=false,openingTrigger=null;
 try{userReduced=localStorage.getItem('marcus-motion')==='reduced';}catch{}
 const opening=document.querySelector('.opening');
 const hero=opening.querySelector('.hero');
 const about=document.querySelector('.about-panel');
 const canvas=document.querySelector('.liquid-canvas');
 const header=document.querySelector('.header');
 const navLinks=[...document.querySelectorAll('.header nav a')];
 function setup(){
   if(media)media.revert();
   opening.classList.remove('opening-enhanced');
   openingTrigger=null;
   const reduced=userReduced||systemMotion.matches;
   hero.classList.toggle('motion-reduced',reduced);
   motionButton.hidden=false;
   motionButton.textContent=reduced?'Reduced motion':'Reduce motion';
   motionButton.setAttribute('aria-pressed',String(reduced));
   motionButton.disabled=systemMotion.matches;
   document.documentElement.style.scrollBehavior=reduced?'auto':'';
   if(reduced){ScrollTrigger.refresh();return;}
   media=gsap.matchMedia();
   media.add({desktop:'(min-width: 761px) and (min-height: 600px)',all:'(min-width: 0px)'},context=>{
     gsap.to('.hero-asterisk',{rotation:120,ease:'none',scrollTrigger:{trigger:'.opening',start:'top top',end:'bottom top',scrub:.6}});
     const setupExperience=()=>{
      gsap.to('.timeline-track i',{scaleY:1,ease:'none',scrollTrigger:{trigger:'.experience-list',start:'top 65%',end:'bottom 65%',scrub:.25}});
      gsap.utils.toArray('.experience-row').forEach(row=>{
       ScrollTrigger.create({trigger:row,start:'top 58%',end:'bottom 58%',toggleClass:'row-active'});
       const reveal=(element,y,start,end)=>gsap.from(element,{
         opacity:0,y,ease:'none',
         scrollTrigger:{trigger:element,start,end,scrub:.45}
       });
       // Reveal the entry as it reaches the viewport, then each achievement in reading order.
       reveal(row.querySelector('.row-number'),0,'top 94%','top 75%');
       reveal(row.querySelector('.role-info'),22,'top 94%','top 72%');
       reveal(row.querySelector('.role-detail'),28,'top 94%','top 75%');
       row.querySelectorAll('.role-summary, .role-detail li').forEach(item=>{
         reveal(item,16,'top 88%','top 64%');
       });
      });
     };
     if(!context.conditions.desktop||liquidDisabled){setupExperience();return;}
     opening.classList.add('opening-enhanced');
     let liquid;
     try{liquid=window.createLiquidCurtain?.(canvas);}catch{liquid=null;}
     if(!liquid){opening.classList.remove('opening-enhanced');setupExperience();return;}
     const fluid={progress:0};
     let dirty=true,openingProgress=0,lastPaint=-Infinity,start=0,travel=1;
     const stage=opening.querySelector('.opening-stage');
     const measure=()=>{
       travel=Math.round(innerHeight*1.8);
       opening.style.height=(stage.offsetHeight+travel)+'px';
       start=opening.getBoundingClientRect().top+scrollY-header.offsetHeight;
       liquid.resize();dirty=true;
     };
     gsap.set(about,{autoAlpha:0});
     about.inert=true;
     // CSS sticky owns the stage position; resize cannot strand a translated pin.
     // The visual timeline follows the actual scroll position in both directions.
     const tl=gsap.timeline({paused:true});
     openingTrigger={get end(){return start+travel;}};
     tl.fromTo(fluid,{progress:0},{progress:1,duration:.54,ease:'none'},.08)
       .fromTo(hero,{autoAlpha:1,y:0},{autoAlpha:0,y:-24,duration:.17,ease:'none'},.34)
       .fromTo(about,{autoAlpha:0,y:24},{autoAlpha:1,y:0,duration:.16,ease:'power1.out'},.56)
       .to({hold:0},{hold:1,duration:.28},.72);
     const tick=()=>{
       if(document.hidden)return;
       const time=performance.now()/1000;
       if(dirty){
         openingProgress=Math.min(1,Math.max(0,(scrollY-start)/travel));
         tl.progress(openingProgress);
         about.inert=openingProgress<.55;hero.inert=openingProgress>.5;
       }
       const waving=openingProgress>.08&&openingProgress<.72;
       if(!dirty&&!waving)return;
       // Only one GPU draw per frame; idle waves need at most 30 frames per second.
       if(!dirty&&time-lastPaint<1/30)return;
       liquid.render(openingProgress>=.72?0:fluid.progress,time);
       dirty=false;lastPaint=time;
     };
     const onScroll=()=>{dirty=true;};
     const onVisible=()=>{if(!document.hidden){measure();tick();}};
     window.addEventListener('scroll',onScroll,{passive:true});
     window.addEventListener('resize',measure);
     document.addEventListener('visibilitychange',onVisible);
     ScrollTrigger.addEventListener('refreshInit',measure);
     measure();gsap.ticker.add(tick);tick();
     // Measure experience positions after the opening's sticky scroll space exists.
     setupExperience();
     return ()=>{
       gsap.ticker.remove(tick);ScrollTrigger.removeEventListener('refreshInit',measure);
       window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',measure);
       document.removeEventListener('visibilitychange',onVisible);
       liquid.destroy();about.inert=false;hero.inert=false;opening.classList.remove('opening-enhanced');opening.style.height='';openingTrigger=null;
     };
   });
   ScrollTrigger.refresh();
 }
 motionButton.addEventListener('click',()=>{
   userReduced=!userReduced;try{localStorage.setItem('marcus-motion',userReduced?'reduced':'full');}catch{}setup();
 });
 systemMotion.addEventListener('change',setup);
 window.addEventListener('liquid-unavailable',()=>{liquidDisabled=true;setup();});
 // The hero is inside a moving, sometimes inert sticky panel. Its native anchor
 // position is not the document top, so every home link uses a stable destination.
 document.querySelectorAll('a[href="#top"]').forEach(link=>link.addEventListener('click',event=>{
   event.preventDefault();history.pushState(null,'','#top');
   window.scrollTo({top:0,behavior:userReduced||systemMotion.matches?'instant':'smooth'});
 }));
 document.querySelectorAll('a[href="#about"]').forEach(link=>link.addEventListener('click',event=>{
   if(!openingTrigger)return;
   event.preventDefault();history.pushState(null,'','#about');
   window.scrollTo({top:openingTrigger.end,behavior:'smooth'});
 }));
 // A fixed header keeps the next section and its heading visible after navigation.
 document.querySelectorAll('a[href="#experience"]').forEach(link=>link.addEventListener('click',()=>{
   document.getElementById('experience').focus({preventScroll:true});
 }));
 const sections=navLinks.map(link=>document.querySelector(link.getAttribute('href'))).filter(Boolean);
 const observer=new IntersectionObserver(entries=>{
   const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
   if(!visible)return;
   navLinks.forEach(link=>{if(link.getAttribute('href')==='#'+visible.target.id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
 },{rootMargin:'-15% 0px -55% 0px',threshold:0});
 sections.forEach(section=>observer.observe(section));
 setup();
 document.fonts?.ready.then(()=>ScrollTrigger.refresh());
 window.addEventListener('pagehide',()=>{if(media)media.revert();});
 window.addEventListener('pageshow',event=>{if(event.persisted)setup();});
})();

