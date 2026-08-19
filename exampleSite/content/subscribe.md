---
title: "Newsletter"
description: "What the subscription page of a taiga site looks like: the form, the promise, the optional archive row and the letter example."
lead: "The page the header bell and the footer link point at. Everything on it is content — the theme brings the form, the frame around a sample letter and nothing else."
---

## Subscribe {#subscribe}

Leave your address and a confirmation letter arrives. That is double opt-in: until you follow the link in it, you are not on the list — protection not from you, but from whoever might type someone else's address here.

{{< newsletter-inline id="form" note="A demo form: this site has no endpoint behind it, so a submission ends in the error state." >}}

## What arrives {#what}

On a real site this is where the promise goes — in the site owner's words, not the theme's:

- An announcement of a new guide: what it is about and why it is worth reading.

- Big updates to old guides: when the text was rewritten, not when a comma was fixed.

- Rarely, a short digest of what the author has been reading.

{{< newsletter-letter-example subject="Queues: GRQ, LRQ and work stealing" from="taiga" address="news@example.com" >}}
Hi!

In the previous part we gave the scheduler one shared queue of runnable goroutines and put a mutex on it. That works — right up until there are eight cores.

Part three is about the way out: every `P` gets a local queue and a slot for the goroutine that was just woken, an overflow spills half of itself into the global queue, and an idle `P` goes stealing rather than waiting to be fed.

**Read the guide → example.com/run-queues/**

— the author

P. S. Next part: what the scheduler does when a thread gets stuck in a system call.
{{< /newsletter-letter-example >}}

## What never arrives {#never}

The short list is the actual promise: no "just checking in" letters, no other people's courses, no seven-letter funnels after signup.

{{< newsletter-archive url="https://github.com/justskiv/taiga/blob/main/docs/newsletter.md" sub="On a real site, a link to the issues themselves." >}}
