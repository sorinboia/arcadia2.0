<script>
import Layout from "../../../layouts/main";
import appConfig from "@/app.config";
import PageHeader from "@/components/page-header";
import { authComputed } from "@/state/helpers";
import {mapActions} from "vuex";


export default {
    page: {
        title: "Wallets",
        meta: [{
            name: "description",
            content: appConfig.description,
        }, ],
    },
    components: {
        Layout,
        PageHeader,
    },
    data() {
        return {
            user: this.$store.state.auth.currentUser,
            title: "Wallets",
            items: [{
                    text: "Crypto",
                    href: "/",
                },
                {
                    text: "Wallets",
                    active: true,
                },
            ],
            totalRows: 1,
            currentPage: 1,
            perPage: 10,
            pageOptions: [10, 25, 50, 100],
            filter: null,
            filterOn: [],
            sortBy: "date",
            sortDesc: true,
            fields: [{
                key: "transactionId",
                label: 'ID'
            },
                {
                    key: "symbol",
                    sortable: true,
                    label: 'Crypto',
                    formatter:  (value) => value.toUpperCase()
                },
                {
                    key: "amount",
                    label: 'Crypto Amount'
                },
                {
                    key: "transactionType",
                    sortable: true,
                    label: 'Type',
                    formatter:  (value) => value.toUpperCase()

                },
                {
                    key: "price",
                    label: 'Unit Price'
                },
                {
                    key: "totalValue",
                    label: 'Total Value'
                },
                {
                    key: "date",
                    sortable: true,
                    label: 'Date',
                    formatter:  (value) => new Date(value)
                },
            ],
            chartValue: {
                series: [],
                options: {
                    labels: ['Available Balance','BTC','ETH','LTC'],

                    plotOptions: {
                        pie: {
                            donut: {
                                labels: {
                                    show: true,
                                    total: {
                                        show:true,
                                        formatter: () => {
                                            const tmp = this.chartValueSeries.reduce((accumulator, currentValue) => accumulator + currentValue);
                                            return (Math.round(tmp * 100) / 100);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
    },
    computed: {
        rows() {
            return this.$store.state.transaction.allTransactions.length;
        },
        allReady() {
            return !!this.$store.state.stock.btc.ticker && !!this.$store.state.transaction.allTransactions;
        },
        chartValueSeries() {
            return [this.user.cash, this.cryptoValue('btc'), this.cryptoValue('eth'), this.cryptoValue('ltc')]
        },
        returnImage() {
            if (this.$store.state.auth.currentUser.picture)
                return `data:image/jpeg;base64,${this.$store.state.auth.currentUser.picture}`;
            else {
                return '<i class="mdi mdi-account-circle text-primary h1"></i>';
            }
        }
    },
    mounted() {
        // Set the initial number of items
        this.getAllTransactions();
        this.totalRows = this.items.length;
        this.chartValue.series = [this.user.cash, this.cryptoValue('btc'), this.cryptoValue('eth'), this.cryptoValue('ltc')];
    },
    methods: {
        ...authComputed,
        ...mapActions('transaction',['getAllTransactions']),
        cryptoValue(symbol) {
            if (!this.$store.state.stock[symbol].ticker) {
                return 'Calculating'
            } else {
                const symbolAmount = this.user.stocks[symbol] || 0;
                const result = Math.round(symbolAmount * this.$store.state.stock[symbol].ticker.bid * 100) / 100;

                return result;
            }
        },
        /**
         * Search the table data with search input
         */
        onFiltered(filteredItems) {
            // Trigger pagination to update the number of buttons/pages due to filtering
            this.totalRows = filteredItems.length;
            this.currentPage = 1;
        },
    },
};
</script>

<template>
<Layout v-if="allReady">
    <PageHeader :title="title" :items="items" />
    <div class="row">
        <div class="col-xl-4">
            <div class="card">
                <div class="card-body">
                    <div class="media">
                        <div class="mr-4">
                            <img
                                    class="rounded-circle header-profile-user"
                                    src="@/assets/images/users/avatar-2.jpg"
                                    alt="Header Avatar"
                            />
                        </div>

                        <div class="media-body">
                            <div class="text-muted">
                                <h5>{{ user.name }}</h5>
                                <p class="mb-1"> {{ user.email }}</p>
                                <p class="mb-0">Account Id: {{ user.accountId }}</p>
                            </div>
                        </div>

                        <b-dropdown class="ml-2 p-0" right variant="white" toggle-class="p-0">
                            <template v-slot:button-content>
                                <i class="mdi mdi-dots-horizontal font-size-18"></i>
                            </template>
                            <b-dropdown-item>Action</b-dropdown-item>
                            <b-dropdown-item>Another action</b-dropdown-item>
                            <b-dropdown-item>Something else here</b-dropdown-item>
                        </b-dropdown>
                    </div>
                </div>
                <div class="card-body border-top">
                    <div class="row">
                        <div class="col-sm-6">
                            <div>
                                <p class="text-muted mb-2">Available Balance</p>
                                <h5>$ {{ user.cash }}</h5>
                            </div>
                        </div>
                    </div>
                </div>


            </div>
        </div>

        <div class="col-xl-8">
            <div class="row">
                <div class="col-sm-4">
                    <div class="card mini-stats-wid">
                        <div class="card-body">
                            <div class="media">
                                <div class="mr-3 align-self-center">
                                    <i class="mdi mdi-bitcoin h2 text-warning mb-0"></i>
                                </div>
                                <div class="media-body">
                                    <p class="text-muted mb-2">Bitcoin Wallet</p>
                                    <h5 class="mb-0">
                                        {{ user.stocks.btc || 0 }} BTC
                                        <span class="font-size-14 text-muted"> = $ {{ cryptoValue('btc') }} </span>
                                    </h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-sm-4">
                    <div class="card mini-stats-wid">
                        <div class="card-body">
                            <div class="media">
                                <div class="mr-3 align-self-center">
                                    <i class="mdi mdi-ethereum h2 text-primary mb-0"></i>
                                </div>
                                <div class="media-body">
                                    <p class="text-muted mb-2">Ethereum Wallet</p>
                                    <h5 class="mb-0">
                                        {{ user.stocks.eth || 0 }} ETH
                                        <span class="font-size-14 text-muted"> = $ {{ cryptoValue('eth') }} </span>
                                    </h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-sm-4">
                    <div class="card mini-stats-wid">
                        <div class="card-body">
                            <div class="media">
                                <div class="mr-3 align-self-center">
                                    <i class="mdi mdi-litecoin h2 text-info mb-0"></i>
                                </div>
                                <div class="media-body">
                                    <p class="text-muted mb-2">Litecoin Wallet</p>
                                    <h5 class="mb-0">
                                        {{ user.stocks.ltc || 0 }} LTC
                                        <span class="font-size-14 text-muted"> = $ {{ cryptoValue('ltc') }} </span>
                                    </h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- end row -->

            <div class="card">
                <div class="card-body">
                    <h4 class="card-title mb-3">Account Value</h4>

                    <div>
                        <div id="overview-chart" class="apex-charts" dir="ltr"></div>
                        <apexchart height="240" type="donut" :options="chartValue.options" :series="chartValueSeries"></apexchart>

                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- end row -->
    <div class="row">
        <div class="col-lg-12">
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title mb-4">Activities</h4>
                    <b-tabs content-class="mt-3" nav-class="nav-tabs-custom">
                        <b-tab title="All" active>
                            <div class="row mt-4">
                                <div class="col-sm-12 col-md-6">
                                    <div id="tickets-table_length" class="dataTables_length">
                                        <label class="d-inline-flex align-items-center">
                                            Show&nbsp;
                                            <b-form-select v-model="perPage" size="sm" :options="pageOptions"></b-form-select>&nbsp;entries
                                        </label>
                                    </div>
                                </div>
                                <!-- Search -->
                                <div class="col-sm-12 col-md-6">
                                    <div id="tickets-table_filter" class="dataTables_filter text-md-right">
                                        <label class="d-inline-flex align-items-center">
                                            Search:
                                            <b-form-input v-model="filter" type="search" placeholder="Search..." class="form-control form-control-sm ml-2"></b-form-input>
                                        </label>
                                    </div>
                                </div>
                                <!-- End search -->
                            </div>
                            <!-- Table -->
                            <div class="table-responsive table-hover mb-0">
                                <b-table :items="this.$store.state.transaction.allTransactions" :fields="fields" responsive="sm" :per-page="perPage" :current-page="currentPage" :sort-by.sync="sortBy" :sort-desc.sync="sortDesc" :filter="filter" :filter-included-fields="filterOn" @filtered="onFiltered"></b-table>
                            </div>
                            <div class="row">
                                <div class="col">
                                    <div class="dataTables_paginate paging_simple_numbers float-right">
                                        <ul class="pagination pagination-rounded mb-0">
                                            <!-- pagination -->
                                            <b-pagination v-model="currentPage" :total-rows="rows" :per-page="perPage"></b-pagination>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </b-tab>
                    </b-tabs>
                </div>
            </div>
        </div>
    </div>
</Layout>
</template>
