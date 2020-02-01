<template>
    <span @click="back()" class="back">BACK</span>
</template>

<script>
import GlobalService from '../services/global.service'

    export default {
        methods: {
            back() {
                GlobalService.currentPage.next('mainMenu');
            }   
        }
    }
</script>