<script>
    import { fade, slide, scale, fly } from "svelte/transition";
    let reference = "closed";
    let bg_covid = "bg-covid19";
    let modal1 = false;
    let modal2 = false;
    let modal3 = false;
    let modalShow = false;

    function covidModal1() {
        modal1 = true;
        modalShow = true;
        bg_covid ="bg-covid19-blur";
    }
    function covidModal2() {
        modal2 = true;
        modalShow = true;
        bg_covid ="bg-covid19-blur";
    }
    function covidModal3() {
        modal3 = true;
        modalShow = true;
        bg_covid ="bg-covid19-blur";
    }
    function closeModal() {
        modal1 = false;
        modal2 = false;
        modal3 = false;
        modalShow = false;
        bg_covid ="bg-covid19";
    }
</script>

<svelte:head>
    <title>Drenex | COVID-19</title>
</svelte:head>
<section class="{bg_covid}">
    <div class="text-center">
        <img
            src="assets/5/COVID19-HEADER.png"
            style="width: 75%; margin-top:4%;"
            alt=""
            class="animate__animated animate__fadeIn"
        />
        {#if modalShow}
            <button class="c19">
                <img
                    src="assets/5/clicked/COVID19-CONTENT-1-DEFAULT-BLUR.png"
                    style="width: 100%;"
                    alt=""
                />
            </button>

            <button class="c19">
                <img
                    src="assets/5/clicked/COVID19-CONTENT-2-DEFAULT-BLUR.png"
                    style="width: 100%;"
                    alt=""
                />
            </button>

            <button class="c19">
                <img
                    src="assets/5/clicked/COVID19-CONTENT-3-DEFAULT-BLUR.png"
                    style="width: 100%;"
                    alt=""
                />
            </button>
        {:else}
            <button
                class="c19 hovCovid"
                on:click={() => {
                    covidModal1();
                }}
            >
                <img
                    src="assets/5/default/COVID19-CONTENT-1-DEFAULT.png"
                    style="width: 100%;"
                    alt=""
                    class="animate__animated animate__bounceInLeft animate__delay-1s"
                />
            </button>
            <button
                class="c19 hovCovid"
                in:fade
                on:click={() => {
                    covidModal2();
                }}
            >
                <img
                    src="assets/5/default/COVID19-CONTENT-2-DEFAULT.png"
                    style="width: 100%;"
                    alt=""
                    class="animate__animated animate__bounceInRight animate__delay-2s"
                />
            </button>
            <button
                class="c19 hovCovid"
                in:fade
                on:click={() => {
                    covidModal3();
                }}
            >
                <img
                    src="assets/5/default/COVID19-CONTENT-3-DEFAULT.png"
                    style="width: 100%;"
                    alt=""
                    class="animate__animated animate__bounceInLeft animate__delay-3s"
                />
            </button>
        {/if}
    </div>

    <!-- Modal -->

    <!-- modal1 -->
    {#if modal1}
        <button
            in:fade
            out:fade
            class="modal-covid"
            on:click={() => {
                closeModal();
            }}
        >
            <img
                src="assets/5/clicked/COVID19-CONTENT-1-CLICKED.png"
                style="width: 100%;"
                alt=""
            />
        </button>
    {/if}

    <!-- modal2 -->
    {#if modal2}
        <button
            in:fade
            out:fade
            class="modal-covid"
            on:click={() => {
                closeModal();
            }}
        >
            <img
                src="assets/5/clicked/COVID19-CONTENT-2-CLICKED.png"
                style="width: 100%;"
                alt=""
            />
        </button>
    {/if}

    <!-- modal3 -->
    {#if modal3}
        <button
            in:fade
            out:fade
            class="modal-covid"
            on:click={() => {
                closeModal();
            }}
        >
            <img
                src="assets/5/clicked/COVID19-CONTENT-3-CLICKED.png"
                style="width: 100%;"
                alt=""
            />
        </button>
    {/if}

    <!-- end Modal -->

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
                src="assets/5/references/COVID19-REFERENCE-TAB-ACTIVE-WTEXT.png"
                class="reference"
                alt=""
            />
        </button>
    {/if}
</section>

<style>
    .hovCovid{
        transform: scale(1);
        transition: 1s;
    }
    .hovCovid:hover{
        transform: scale(1.1);
        transition: 1s;
    }
    .modal-covid {
        position: fixed;
        margin: 0 auto;
        top: 13%;
        right: 0;
        z-index: 2;
        left: 0;
        bottom: 0;
        width: 75%;
    }
    .c19 {
        width: 75%;
        margin-top: 2%;
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
