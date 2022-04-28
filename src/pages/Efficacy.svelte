<script>
    import { fade, fly } from "svelte/transition";
    let reference = "closed";
    let bg_efficacy = "bg-efficacy";
    let modal1 = false;
    let modal2 = false;
    let modalshow = false;

    function modalshow1() {
        bg_efficacy = "bg-efficacy-blur";
        modal1 = true;
        modalshow = true;
    }
    function modalshow2() {
        bg_efficacy = "bg-efficacy-blur";
        modal2 = true;
        modalshow = true;
    }

    function closeModal() {
        bg_efficacy = "bg-efficacy";
        modal1 = false;
        modal2 = false;
        modalshow = false;
    }
</script>

<svelte:head>
    <title>Drenex | EFFICACY</title>
</svelte:head>
<section class={bg_efficacy}>
    <div class="text-center">
        <img
            src="assets/3/EFFICACY-HEADER.png"
            style="width: 40%; margin-top:5%;"
            alt=""
            class="animate__animated animate__bounceIn"
        />
        {#if modalshow}
            <button style="width: 70%;">
                <img
                    src="assets/3/clicked/EFFICACY-CONTENT-2-DEFAULT-BLUR.png"
                    style="width: 100%; margin-top:5%;"
                    alt=""
                />
            </button>
            <button style="width: 70%;">
                <img
                    src="assets/3/clicked/EFFICACY-CONTENT-1-DEFAULT-BLUR.png"
                    style="width: 100%; margin-top:5%;"
                    alt=""
                />
            </button>
        {:else}
            <button
                style="width: 70%;"
                on:click={() => {
                    modalshow1();
                }}
                class="hovEfficacy"
            >
                <img
                    src="assets/3/default/EFFICACY-CONTENT-1-DEFAULT.png"
                    style="width: 100%; margin-top:5%;"
                    alt=""
                    class="animate__animated animate__fadeInLeft"
                />
            </button>
            <button
                style="width: 70%;"
                on:click={() => {
                    modalshow2();
                }}
                class="hovEfficacy"
            >
                <img
                    src="assets/3/default/EFFICACY-CONTENT-2-DEFAULT.png"
                    style="width: 100%; margin-top:5%;"
                    alt=""
                    class="animate__animated animate__fadeInRight"
                />
            </button>
        {/if}

        <!-- modal -->

        {#if modal1}
            <button
            in:fade
            out:fade
                class="modal-efficacy"
                on:click={() => {
                    closeModal();
                }}
            >
                <img
                    src="assets/3/clicked/EFFICACY-CONTENT-1-CLICKED.png"
                    style="width: 100%;"
                    alt=""
                />
            </button>
        {/if}

        {#if modal2}
            <button
            in:fade
            out:fade
                class="modal-efficacy"
                on:click={() => {
                    closeModal();
                }}
            >
                <img
                    src="assets/3/clicked/EFFICACY-CONTENT-2-CLICKED.png"
                    style="width: 100%;"
                    alt=""
                />
            </button>
        {/if}
        <!-- end Modal -->
    </div>

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
                src="assets/3/reference/EFFICACY-REFERENCE-TAB-ACTIVE-wtext.png"
                class="reference"
                alt=""
            />
        </button>
    {/if}
</section>

<style>
    .hovEfficacy{
        transform: scale(1);
        transition: 1s;
    }
   .hovEfficacy:hover{
       transform: scale(1.1);
       transition: 1s;
   }
    .modal-efficacy {
        position: fixed;
        margin: 17% auto;
        top: 0;
        right: 0;
        z-index: 2;
        left: 0;
        bottom: 0;
        width: 70%;
    }
    .ref {
        position: absolute;
        background-color: none;
        background: none;
        border: none;
        top: -1%;
        z-index: 100;
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
