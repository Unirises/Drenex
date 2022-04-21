<script>
    let reference = "closed";
</script>
<section class="bg-bioavailability">

    {#if reference == "closed"}
    <button class="ref2" on:click="{()=> {reference = "open"}}">
        <img
        src="assets/2/Reference/ACTION-REFERENCE-TAB.png"
        class="reference2"
        alt=""
    />
    </button>
    {/if}
    {#if reference == "open"}
    <button class="ref" on:click="{()=> {reference = "closed"}}">
        <img
        src="assets/2/Reference/ACTION-REFERENCE-TAB-ACTIVE-WTEXT.png"
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
