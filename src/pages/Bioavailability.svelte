<script>
    import { fade, slide, scale, fly } from "svelte/transition";
    let reference = "closed";
    let bg_bioavailability = "bg-bioavailability";
    let modalShow = false;
    function showModal(){
        bg_bioavailability = "bg-bioavailability-blur"
        modalShow = true;
    }
    function closeModal(){
        bg_bioavailability = "bg-bioavailability"
        modalShow = false;
    }
</script>

<svelte:head>
    <title>Drenex | BIOAVAILABILITY</title>
</svelte:head>
<section class={bg_bioavailability}>
    <div class="row">
        <div class="col-sm-6">
            <div style="margin: 10%;">
                {#if modalShow == false}
                <img
                    src="assets/4/BIOA-HEADER.png"
                    style="width: 75%;"
                    alt=""
                />
                    <button style="width: 100%;" class="hoverBio" on:click="{()=>{showModal()}}">
                        <img
                            src="assets/4/default/BIOA-CONTENT-DEFAULT.png"
                            style="margin-top: 5%; width:100%;"
                            alt=""
                        />
                    </button>
                {/if}
            </div>
        </div>
        <div class="col-sm-6" />
    </div>

    {#if modalShow}
    <button in:fade out:fade on:click="{()=>{closeModal()}}" class="modal-bio">
        <img
            src="assets/4/clicked/BIOA-CONTENT-CLICKED.png"
            style="width: 100%;"
            alt=""
        />
    </button>
    {/if}

    {#if reference == "closed"}
        <button
            class="ref2"
            in:fade
            out:fade
            on:click={() => {
                reference = "open";
            }}
        >
            <img
                src="assets/2/Reference/ACTION-REFERENCE-TAB.png"
                class="reference2"
                alt=""
            />
        </button>
    {/if}
    {#if reference == "open"}
        <button
            class="ref"
            in:fly={{ x: 500, duration: 1000 }}
            out:fly={{ x: 500, duration: 1000 }}
            on:click={() => {
                reference = "closed";
            }}
        >
            <img
                src="assets/4/references/BIOA-REFERENCE-TAB-ACTIVE-WTEXT.png"
                class="reference"
                alt=""
            />
        </button>
    {/if}
</section>

<style>
    .hoverBio{
        transform: scale(1);
        transition: 1s;
    }
    .hoverBio:hover{
        transform: scale(1.1);
        transition: 1s;
    }
    .modal-bio {
        position: fixed;
        margin: 10% auto;
        top: 0;
        right: 0;
        z-index: 2;
        left: 0;
        bottom: 0;
        width: 45%;
    }
    .ref {
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
    button {
        background-color: none;
        background: none;
        border: none;
        cursor: pointer;
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
