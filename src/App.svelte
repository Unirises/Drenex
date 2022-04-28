<script>
	import Router from 'svelte-spa-router';
	import Nav from "./pages/Nav.svelte";

	import Home from "./pages/Home.svelte";
	import Action from "./pages/Action.svelte";
	import Efficacy from "./pages/Efficacy.svelte";
	import Bioavailability from "./pages/Bioavailability.svelte";
	import Covid19 from "./pages/Covid19.svelte";
	import Dosage from "./pages/Dosage.svelte";

	const password = "123";
	let bind_password = "";

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


{#if password == bind_password}

<Router {routes} />

<Nav />
{:else}
<div class="bg-home">
	<div class="text-center">
			<img src="assets/1/HOME-LOGO_uap.png" style="width: 10%; margin-top:30vh;" alt="Kastair logo"><br>
			<input type="text" required class="mt-4 inputLogin" placeholder="Type the password here." bind:value="{bind_password}">
			<br>
			<label for class="mt-2 text-white">Please input the correct password to continue.</label>
		</div>
	
</div>


{/if}
<style>
	.inputLogin{
		padding: 10px;
		width: 400px;
		border-radius: 10px;
	}
	.inputLogin:focus{
		outline: none;
	}
</style>