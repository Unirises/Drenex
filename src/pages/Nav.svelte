<script>
    import {link, location} from 'svelte-spa-router'
    let current_page = window.location.href.split('/').pop();
    function activeNav(event) {
      current_page =window.location.href.split('/').pop()
      console.log(current_page);
    }
  </script>
  
<div class="navigation">
    <div class="d-grid gap1">
        <div id="full" class="d-flex mb-1">
            <img src="assets/nav/BAR-LOGO.png" style="margin-right: 5%; margin-left:2%; width:14%;" alt="" />
            <a href="#/" use:link class="flex-fill mr-2" on:click="{(event)=> {activeNav(event)}}">
                {#if current_page == ''}
                <button type="button" style="width: 100%; height:110%;" class="btnBGS"
                    >HOME</button
                >
                {:else}
                <button type="button" style="width: 100%; height:100%;" class="btnBG"
                    >HOME</button
                >
                {/if}
            </a>

            
            <a href="#/action" use:link class="flex-fill mr-2" on:click="{(event)=> {activeNav(event)}}">
                {#if current_page == 'action'}
                <button type="button" style="width: 100%; height:110%;" class="btnBGS"
                    >ACTION</button
                >
                {:else}
                <button type="button" style="width: 100%; height:100%;" class="btnBG"
                    >ACTION</button
                >
                {/if}
            </a>
            <a href="#/efficacy" use:link class="flex-fill mr-2" on:click="{(event)=> {activeNav(event)}}">
                {#if current_page == 'efficacy'}
                <button type="button" style="width: 100%; height:110%;" class="btnBGS"
                    >EFFICACY</button
                >
                {:else}
                <button type="button" style="width: 100%; height:100%;" class="btnBG"
                    >EFFICACY</button
                >
                {/if}
            </a>
            <a href="#/bio" use:link class="flex-fill mr-2" on:click="{(event)=> {activeNav(event)}}">
                {#if current_page == 'bio'}
                <button type="button" style="width: 100%; height:110%;" class="btnBGS"
                    >BIOAVAILABILITY</button
                >
                {:else}
                <button type="button" style="width: 100%; height:100%;" class="btnBG"
                    >BIOAVAILABILITY</button
                >
                {/if}
            </a>
            <a href="#/covid19" use:link class="flex-fill mr-2" on:click="{(event)=> {activeNav(event)}}">
                {#if current_page == 'covid19'}
                <button type="button" style="width: 100%; height:110%;" class="btnBGS"
                    >COVID-19</button
                >
                {:else}
                <button type="button" style="width: 100%; height:100%;" class="btnBG"
                    >COVID-19</button
                >
                {/if}
            </a>
            <a href="#/dosage" use:link class="flex-fill mr-2" on:click="{(event)=> {activeNav(event)}}">
                {#if current_page == 'dosage'}
                <button type="button" style="width: 100%; height:110%;" class="btnBGS"
                    >DOSAGE</button
                >
                {:else}
                <button type="button" style="width: 100%; height:100%;" class="btnBG"
                    >DOSAGE</button
                >
                {/if}
            </a>
            <button type="button" class="flex-fill btnBG2"
                >EXIT</button
            >
        </div>
    </div>
</div>

<style>
    .btnBG{
        background-color: #ff9d14;
        color: white;
        font-weight: bold;
        margin-top:3px;
    }
    .btnBG2{
        background-color: #ff0000;
        color: white;
        font-weight: bold;
        border-top-left-radius: 20px;
        border-bottom-left-radius: 20px;
    }
    
    .btnBGS{
        background-color: #ff6600;
        margin-top:-4px;
        height: 32px;
        border-top-left-radius: 20px;
        border-top-right-radius: 20px;
        color: white;
        font-weight: bold;
    }
    .navigation{
        position: absolute; width:100%; bottom:0;
        background-color: #ffffff;
        padding-top: 5px;
        z-index: 1000;
    }
    button:focus {
        outline: 0;
        background-color: #ff6600;
        background: #ff6600;
        border: none;
    }
</style>
