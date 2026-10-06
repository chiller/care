TABLE OF CONTENTS

- [howto.md](howto.md) — how to install and run the prototype, which pages to visit, and its features (AI-generated)
- [spec.md](spec.md) — the prototype spec, derived from my prompts and kept up to date as the prototype changed (AI-generated)
- This README — my own notes: preparation and initial thoughts, the prompts I used, and closing thoughts (written by me)

PREPARATION AND INITIAL THOUGHTS

Documenting the process and the choices made begins even before documenting any technical or domain decisions.
It seems documenting decisions is the most important part of the assignment and the code that is generated for
this is secondary. The initial readme describes multiple sides of the problem space, but it seems that 
the most important problem to solve is to get certainty that "speed of the first reply" is the most impactful
metric that contributes to the success of the recruitment portal and your customers. 

A decision also has to be made regarding the use of AI for this assignment, I would rather not have to hand in
a lot of generated code that either I or the reviewer will have to read, on the other hand 3 hours is not a lot of 
time to build a system by hand, like in the old days. The same goes for documentation, which I assume a human will read and
it seems the respectful thing to do to highlight when the things I wrote end and the AI generated part begins.

So the solution should enable the hiring manager to respond promptly to new applications, but what outcome improves if that happens?
You are trying I assume to sell to your customers that using the new product (the recruitment portal) is worth it
so that effectively means fewer days closed and less money spent on agency because of faster and better quality hiring
when recruiting through the recruitment portal. Better quality staff can mean that in an environment of high turnover
they stick around for longer. Decreasing time to filling a position and increasing quality of hire I imagine can pull
in different directions, so the tool should not put much pressure on hiring fast.

What is the minimum amount of development work we can do to show that a manager can promptly answer a job application
and move on from there. The solution will have some kind of realtime or push notification component. 

There is no time to understand the code that AI will produce, I am thinking, the code and the prototype
is just there to drive the product shaping and decision process. So I anticipate if I want to be notified as quickly as possible
that conflicts with my desire to not be spammed, so the prototype will be some kind of realtime simulation of one
manager and a lot of sites and openings.

PROMPTS

Let's make a first proof of concept web app with two pages, a portal side and a manager side, any applications should appear in realtime to the manager side. We don't need a backend, use typescript and react on the frontend. Derive a spec
from all my instructions and keep it up to date.

As a next step I want a play button on the portal page that simulates people applying with random data at random intervals, add a slider to adjust how often the simulation should apply. Add this instruction to the spec

Add a state for new applications that is read or unread and the list should be sorted unread first, the unread rows should have a different style, clicking on an application should open a dialog where a state transition is enabled (reject, schedule call (replied))

Next, it is quite annoying and unfair to the applicants that a new application takes the top spot in the list, reverse the list of unread applications, new ones should go to the bottom. Also separate the list vertically: unread (new), read (new), replied, and the rest

(here I realise prompts will just be documentation as well, so will make them more verbose)

we don't need the live counter of how long the application has been in the state, it's unnecessary pressure and noise

That's a lot of applications, make the different vertical sections collapsible.

Great so I am thinking I want a collapsible sidebar with all the recent notifications, imagine I stepped away from the platform for some hours. I think it will look noisy if there was a burst of notifications.
For now we have the list of new applications with new ones coming in realtime at the bottom, I'd like the activity sidebar to show newest at the top.

(Now I am thinking for the prototype this is enough progress on realtime for now, the notifications in Activity I imagine will go out as a push notification to the hiring manager
but that needs to be throttled, otherwise they get 20 push notifications in one minute, so in a mature system I am thinking some sort of cron job will send out the aggregate.)

Looking at what we have I'm thinking we schedule calls, but that has to be a very limited resource: the time of the hiring manager. 
We need a page allowing editing of the hiring manager's schedule that is available for 30 minute hiring calls (6 per day max). When opening the dialog for an applicant there should be a handful of available slots, and clicking on those slots as buttons also performs
the state transition into call scheduled, remove the previous schedule call button. There is no point scheduling 2 weeks in the future, that is too long, so we can run out of time slots here. Let's see what this looks like.

I want to see what happens when we run out of slots, add a button next to "reset demo" that says "simulate auto booking", that should book all the applicants first come first served into available slots, it should stop when there are no more slots, 
it should show an error snackbar when there are no more available slots in the time interval. 
That should prompt the hiring manager to make some hard decisions, so that means the schedule view should also open the application dialog when clicking a filled slot.

The error banner should also appear if reaching this fully booked state by manually scheduling (seems to only work on simulate auto booking)

Getting to the end of this time boxed prototyping my last thought is that I need more warning about running out of slots, so that means a warning alert. 


CLOSING THOUGHTS


I think the simulation is effective and fun to see how messy it is when a lot of applications come in and the hiring manager is overwhelmed. 
I did not think about the portal side of the problem deeply enough, but the first question to tackle there is how much data should we ask

Opus 5.5 is incredibly fast on greenfield especially. I don't even have time to context switch into fixing/writing documentation and it's ready and waiting for my input. 
I considered showing commited snapshot of every state, but I am thinking the main thing I am submiting is my though process around prompting and shaping the prototype.
I need another 2-3 hours just to think through and list all the things that are missing here. 