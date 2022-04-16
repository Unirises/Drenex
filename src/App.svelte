<script>
	import Router from "svelte-spa-router";
	import Nav from "./pages/Nav.svelte";

	import Home from "./pages/Home.svelte";
	import Action from "./pages/Action.svelte";
	import Efficacy from "./pages/Efficacy.svelte";
	import Bioavailability from "./pages/Bioavailability.svelte";
	import Covid19 from "./pages/Covid19.svelte";
	import Dosage from "./pages/Dosage.svelte";

	const routes = {
		"/": Home,
		"/action": Action,
		"/efficacy": Efficacy,
		"/bio": Bioavailability,
		"/covid19": Covid19,
		"/dosage": Dosage,
		// '*': NotFound
	};
</script>

<Router {routes} />
<Nav />
