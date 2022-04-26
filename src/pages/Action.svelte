<script>
    import { fade, slide, scale, fly } from "svelte/transition";
    let reference = "closed";
    let c1 = true;
    let c2 = true;
    let c3 = true;
    let c4 = true;
    let c5 = true;
    let c6 = true;
    let c7 = true;
    let c8 = true;

    let wc1 = "10%";
    let wc2 = "10%";
    let wc3 = "10%";
    let wc4 = "10%";

    let wc5 = "12.5%";
    let wc6 = "10.2%";
    let wc7 = "10.2%";
    let wc8 = "10.2%";


    function ck1(){
        if(c1 == true){
            c1=false;
            wc1 = "40%";
        }else{
            c1=true;
            wc1 = "10%";
        }
    }
    function ck2(){
        if(c2 == true){
            c2=false;
            wc2 = "31%";
        }else{
            c2=true;
            wc2 = "10%";
        }
    }
    function ck3(){
        if(c3 == true){
            c3=false;
            wc3 = "41%";
        }else{
            c3=true;
            wc3 = "10%";
        }
    }
    function ck4(){
        if(c4 == true){
            c4=false;
            wc4 = "26%";
        }else{
            c4=true;
            wc4 = "10%";
        }
    }

    function ck5(){
        if(c5 == true){
            c5=false;
            wc5 = "30%";
        }else{
            c5=true;
            wc5 = "12.5%";
        }
    }

    function ck6(){
        if(c6 == true){
            c6=false;
            wc6 = "39%";
        }else{
            c6=true;
            wc6 = "10.2%";
        }
    }

    function ck7(){
        if(c7 == true){
            c7=false;
            wc7 = "44%";
        }else{
            c7=true;
            wc7 = "10.2%";
        }
    }
    function ck8(){
        if(c8 == true){
            c8=false;
            wc8 = "44%";
        }else{
            c8=true;
            wc8 = "10.2%";
        }
    }


</script>

<svelte:head>
    <title>Drenex | Action</title>
</svelte:head>
<section class="bg-action">
    <div class="text-center">
        <img
            src="assets/2/ACTION-HEADER.png"
            style="width: 70%; margin-top:5%;"
            alt=""
        />

        <div style="margin-left: 10%; margin-right:10%; margin-top:1%;">
            <div class="row" style="padding-left: 10%;">
                <div class="col-lg-5 bg1 mr-3">
                    <img
                        src="assets/2/ACTION-SUBHEADER1.png"
                        style="width:100%;"
                        alt=""
                    />
                    <div style="margin-top:5%;">
                        <button style="width:{wc1}; margin-top: 5%;" on:click="{()=>{ck1()}}">
                            {#if c1}
                            <img
                                src="assets/2/Default/Inflammation.png "
                                style=" width:100%;"
                                alt=""
                            />
                            {:else}
                            <img
                                src="assets/2/clicked/Inflammation.png "
                                style=" width:100%;"
                                alt=""
                            />
                            {/if}
                        </button><br />
                        <button style="width:{wc2}; margin-top: 5%;" on:click="{()=>{ck2()}}">
                            {#if c2}
                            <img
                                src="assets/2/Default/Allergies.png"
                                style=" width:100%;"
                                alt=""
                            />
                            {:else}
                            <img
                                src="assets/2/clicked/Allergies.png"
                                style=" width:100%;"
                                alt=""
                            />
                            {/if}
                        </button><br />
                        <button style="width:{wc3}; margin-top: 5%;" on:click="{()=>{ck3()}}">
                            {#if c3}
                            <img
                                src="assets/2/Default/Cerebral_edema.png"
                                style=" width:100%;"
                                alt=""
                            />
                            {:else}
                            <img
                                src="assets/2/clicked/Cerebral_edema.png"
                                style=" width:100%;"
                                alt=""
                            />
                            {/if}
                        </button><br />
                        <button
                            style="width:{wc4}; margin-top: 5%; margin-bottom:5%;" on:click="{()=>{ck4()}}"
                        >
                        {#if c4}
                            <img
                                src="assets/2/Default/Shock.png"
                                style="width:100%;"
                                alt=""
                            />
                            {:else}
                            <img
                                src="assets/2/clicked/Shock.png"
                                style="width:100%;"
                                alt=""
                            />
                            {/if}
                        </button><br />
                    </div>
                </div>
                <div class="col-lg-5 bg2 ml-3">
                    <img
                        src="assets/2/ACTION-SUBHEADER2.png"
                        style="width:99.5%;"
                        alt=""
                    />
                    <div style="margin-top:5%;">
                        <button style="margin-top: 4%; width:{wc5}" on:click="{()=>{ck5()}}">
                            {#if c5}
                            <img
                                src="assets/2/Default/Asthma.png"
                                style=" width:100%;"
                                alt=""
                            />
                            {:else}
                            <img
                            src="assets/2/clicked/Asthma.png"
                            style=" width:100%;"
                            alt=""
                        />
                            {/if}
                        </button><br />
                        <button style="margin-top: 4%; width:{wc6};" on:click="{()=>{ck6()}}">
                            {#if c6}
                            <img
                                src="assets/2/Default/Atopic_and_contact_dermatitis.png"
                                style=" width:100%;"
                                alt=""
                            />
                            {:else}
                            <img
                                src="assets/2/clicked/Atopic_and contact_dermatitis.png"
                                style=" width:100%;"
                                alt=""
                            />
                            {/if}
                        </button><br />
                        <button style="margin-top: 4%; width:{wc7}" on:click="{()=>{ck7()}}">
                            {#if c7}
                            <img
                                src="assets/2/Default/Drug_hypersensitivity_reactions.png"
                                style=" width:100%;"
                                alt=""
                            />
                            {:else}
                            <img
                                src="assets/2/clicked/Drug_hypersensitivity_reactions.png"
                                style=" width:100%;"
                                alt=""
                            />
                            {/if}
                        </button><br />
                        <button
                            style="width:{wc8}; margin-top: 4%; margin-bottom:5%;" on:click="{()=>{ck8()}}"
                        >
                        {#if c8}
                            <img
                                src="assets/2/Default/Cushing_disease as_a_diagnostic agent.png"
                                style=" width:100%;"
                                alt=""
                            />
                            {:else}
                            <img
                                src="assets/2/clicked/Cushing_disease as_a_diagnostic agent.png"
                                style=" width:100%;"
                                alt=""
                            />
                            {/if}
                        </button><br />
                    </div>
                </div>
            </div>
        </div>
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
                src="assets/2/Reference/ACTION-REFERENCE-TAB-ACTIVE-WTEXT.png"
                class="reference"
                alt=""
            />
        </button>
    {/if}
</section>

<style>
    .bg1 {
        background-image: url("../assets/2/ACTION-CONTENT1-BG.png");
        background-repeat: no-repeat;
        background-size: 100% 100%;
        height: 100%;
        padding: 1% 1% 1% 1%;
    }
    .bg2 {
        background-image: url("../assets/2/ACTION-CONTENT2-BG.png");
        background-repeat: no-repeat;
        background-size: 100% 100%;
        height: 100%;
        padding: 1% 1% 1% 1%;
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
