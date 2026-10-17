# Elli's ideas for Move With Elli

Every idea sent from the app's 💡 **"Note an idea"** button, in Elli's own words, grouped, with
where it stands. The original list lives in Supabase (project `move-with-elli`, table `ideas`;
see CLAUDE.md, "Elli's ideas"). Claude copies new ones here at the start of each session and
updates the status as work lands.

**Status:** ✅ done · 🔜 planned / partly done · 🆕 not started
**Last synced:** 2026-10-17

---

## 🐞 Bugs

| # | Status | Elli's words | What happened |
|---|---|---|---|
| 12 | 🔜 | "There was a bug with the circle that doesn't show the time passing and it just stays on top like a dot, a green dot…" | Fixed in PR #32 (the ring's animation was freezing it). **Waiting for Elli to confirm on her Android phone.** |
| 13 | ✅ | "The next exercise was not announced… it should announce [before the end]." | PR #32: every move names the next one about 10 s before it ends. |
| 15 | ✅ | "For the deep squat, I had 37 seconds, which is weird." | PR #32: every move's time is a round number (steps of 5 s). |
| 25 | ✅ | "When I open the drawers from the bottom… the page behind it is still scrollable." | PR #32: the page behind a sheet stays still. |
| 11 | ✅ | "When I have hip circles, there is no switch between sides… Same with the leg swings." | PR #32: moves that go two ways say "Switch sides" / "Now the other way" halfway. |

## 🔁 Workout flow

| # | Status | Elli's words | What happened |
|---|---|---|---|
| 18 | ✅ | "I don't think we need the rest, the next up, and another session of 3 seconds… Just in the same rest tell me the next one, and then 3-2-1." | One 15 s "Rest · Next up" screen between moves (15 s chosen from research — README "The research behind it"). |
| 21 | ✅ | "The core finisher is not clear… it's like a backward announcement. Also I don't understand what these flutter exercises are." | The rest before it now says "Circuit done! Now a short core finisher." *(Explaining flutter kicks → see "Understanding the moves".)* |
| 10 | ✅ | "If I, by mistake, get out of the workout, I want to be able to resume it and… go back to an exercise if I missed it." | End keeps your spot (Home offers Resume) and there's a **Back** button. |
| 16 | ✅ | "Pull-ups… I'm not able to do the number that is mentioned because there is a time limit… I will do as many as I can, right?" | Counted moves are a goal: "Up to 8 reps", "as many as you can, up to 8". |
| 20 | 🆕 | "Would it be better to have each exercise one after the other… sets for each exercise and then move on?" | This exists as **Stations** (Change workout → More options → How to repeat), but it's hidden. To do: make it easy to find. |
| 19 | ✅ | "Maybe the 27 minutes is about the other times that I get to rest… right?" | Answered: yes, the minutes include the rests and changeovers. |

## ❓ Understanding the moves

| # | Status | Elli's words | What happened |
|---|---|---|---|
| 9 | 🆕 | "Add some simple images of the exercises… so it will be easier to understand, not only from text." | Needs a decision first: drawings, photos or short animations. |
| 14 | 🆕 | "In shoulder rotation I didn't understand exactly what it means. Also arm swings: …should my hand be on my shoulder? Are they full circles?… We need to find a way to communicate it better." | Rewrite the unclear how-tos; images (#9). |
| 17 | 🆕 | "In the leopard crawl it's not clear what it is. What do you mean, 'stay low, smooth, and quiet'?" | Rewrite the how-to. |

## 🏠 Home & settings

| # | Status | Elli's words | What happened |
|---|---|---|---|
| 22 | 🆕 | "Maybe the Change Workout button should be somewhere else because I cannot see it and I need to scroll… next to the Today Workout." | |
| 24 | 🆕 | "The core finisher should also be something I should be able to swap… it should have a few options." | |
| 26 | 🆕 | "How come there are some exercises that I cannot swap?" | Today the sheet says when there's nothing else of that kind with your equipment; Home should make that clearer. |
| 28 | 🆕 | "In the advanced options… choose which area I want to strengthen. For example legs and glutes, or just glutes, or abs, or arms and shoulders." | |
| 29 | 🆕 | "The languages there are too much information… for now we only need the accents: Australian, New Zealand, Canada, United Kingdom, United States, Ireland." | |

## 📅 History

| # | Status | Elli's words | What happened |
|---|---|---|---|
| 23 | 🆕 | "After I finish my workout where can I see the timeline, what I did, how I felt, and also the date? When I hit Done the page with what I did disappeared." | |

## 🔭 Bigger ideas / research

| # | Status | Elli's words | What happened |
|---|---|---|---|
| 8 | 🔜 | "The ideas… should be saved somewhere persistent… a way for you to track them… I want to share this option with other people when I productize this app." | Ideas now go to Supabase and this file. **Later:** open it to other users (votes, no duplicates) and move to GitHub issues — see TODO. |
| 27 | 🆕 | "Share a list of exercises that I just learned and add them to our pool… split into what it's working on, like legs, arms, or glutes." | |
| 30 | 🆕 | "Is there a way to make the speech more natural? What should we research?" | |
