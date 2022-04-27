<script>
    import { fade, slide,scale, fly } from 'svelte/transition'
    let reference = "closed";
</script>
<svelte:head>
  <title>Drenex | DOSAGE</title>
</svelte:head>
<section class="bg-dosage">

    <div class="row">
        <div class="col-sm-6 text-center">
            <img src="assets/6/final.png" style="width: 80%;" alt="">
        </div>
        <div class="col-sm-6">
            <div>
                <img src="assets/6/DOSAGE-CONTENT_2.png" style="width: 50%; position:absolute; bottom:0; left:0; right:0; margin:0 auto;" alt="">
            </div>
        </div>

    </div>



    {#if reference == "closed"}
    <button class="ref2" in:fade out:fade on:click="{()=> {reference = "open"}}">
        <img
        src="assets/2/Reference/ACTION-REFERENCE-TAB.png"
        class="reference2"
        alt=""
    />
    </button>
    {/if}
    {#if reference == "open"}
    <button class="ref" in:fly="{{ x: 500, duration: 1000 }}" out:fly="{{ x: 500, duration: 1000 }}" on:click="{()=> {reference = "closed"}}">
        <img
        src="assets/6/References/DOSAGE-REFERENCE-TAB-ACTIVE-wtext.png"
        class="reference"
        alt=""
    />
    </button>
    {/if}

</section>
<style>
    .ref{
        position: absolute;
        background-color: none;
        background: none;
        border: none;
        top: -1%;
        right: -0.4%;
    }
    .reference {
        height: 100vh;
       
    }
    .reference2 {
        height: 15vh;
       
    }
    .ref2 {
        position: absolute;
        background-color: none;
        background: none;
        border: none;
        top: -1%;
        right: -0.4%;
        bottom: -45%;
    }
    button:active {
        outline: none;
        border: none;
    }
    button:focus {
        outline: 0;
        background-color: none;
        background: none;
    }
</style>