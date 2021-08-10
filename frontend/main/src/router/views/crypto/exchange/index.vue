<script>
import Layout from "../../../layouts/main";
import appConfig from "@/app.config";
import PageHeader from "@/components/page-header";
import { mapActions } from 'vuex';

import { priceCandlestickChart, notificationData } from "./data";

/**
 * Exchange component
 */
export default {
  page: {
    title: "Exchange",
    meta: [{ name: "description", content: appConfig.description }]
  },
  components: { Layout, PageHeader },
  methods: {
    ...mapActions('stock',['getAllStockCandles','stockTransaction']),
    ...mapActions('transaction',['getAllTransactions']),
    async makeStockTransaction() {
      this.transactionModal.loading = true;
      this.transactionModal.details = null;
      this.transactionModal.show = true;
      const result = await this.stockTransaction({
        symbol:this.transaction.crypto,
        transactionType: this.transaction.type == 0 ? 'buy' : 'sell',
        amount: this.transaction.amount
      });

      this.transactionModal.details = result;
      this.transactionModal.loading = false;
    },
    resetTransactionModal() {
      this.transactionModal.show = false;
    },
    onFiltered(filteredItems) {
      // Trigger pagination to update the number of buttons/pages due to filtering
      this.totalRows = filteredItems.length;
      this.currentPage = 1;
    },

  },
  computed: {
    cryptoPrice() {
      return this.$store.state.stock[this.transaction.crypto].ticker[this.transaction.type == 0 ? 'ask' : 'bid']
    },
    totalValue() {
      return this.cryptoPrice * this.transaction.amount;
    },
    allReady() {
      return !!this.$store.state.stock.btc.ticker && !!this.$store.state.stock.btc.candles;
    },
    transactionModalMsg() {
      if (this.transactionModal.details.status == 'success') {
        return `Transaction ${this.transactionModal.details.transactionId} successful`;
      } else if (this.transactionModal.details.status == 'fail') {
        return this.transactionModal.details.reason;
      } else {
        return 'ERROR, please try again later'
      }
    },
    transactionModalColor() {
      if (this.transactionModal.details && this.transactionModal.details.status == 'success') {
        return 'outline-success';
      } else {
        return 'outline-danger';
      }
    },
    rows() {
      return this.$store.state.transaction.allTransactions.length;
    },
  },
  mounted() {
    this.getAllStockCandles();
    this.getAllTransactions();
  },
  data() {
    return {
      transactionModal: {
        show: false,
        loading: true,
        details: null
      },
      transactionTypes: ['Buy','Sell'],
      transaction: {
        type: 0,
        crypto: 'btc',
        amount: null
      },
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
      priceCandlestickChart: priceCandlestickChart,
      notificationData: notificationData,
      title: "Exchange",
      items: [
        {
          text: "Crypto",
          href: "/"
        },
        {
          text: "Exchange",
          active: true
        }
      ]
    };
  }
};
</script>

<template>
  <Layout v-if="allReady">
    <PageHeader :title="title" :items="items" />
    <div class="row">
      <div class="col-lg-12">
        <div class="card">
          <div class="card-body">
            <div class="media">
              <div class="mr-3">
                <img
                  src="@/assets/images/users/avatar-2.jpg"
                  alt
                  class="avatar-md rounded-circle img-thumbnail"
                />
              </div>
              <div class="media-body align-self-center">
                <div class="text-muted">
                  <h5>{{ this.$store.state.auth.currentUser.name }}</h5>
                  <p class="mb-1">{{ this.$store.state.auth.currentUser.email }}</p>
                  <p class="mb-0">Account Id: {{ this.$store.state.auth.currentUser.accountId }}</p>
                </div>
              </div>
              <b-dropdown ngbDropdown menu-class="dropdown-menu-md" right variant="light">
                <template v-slot:button-content>
                  <i class="mdi mdi-wallet mr-1"></i>
                  <span class="d-none d-sm-inline-block" ngbDropdownToggle>
                    Wallet Balance
                    <i class="mdi mdi-chevron-down"></i>
                  </span>
                </template>

                <div class="dropdown-item-text">
                  <div>
                    <p class="text-muted mb-2">Available Balance</p>
                    <h5 class="mb-0">$ {{ this.$store.state.auth.currentUser.cash }}</h5>
                  </div>
                </div>
                <b-dropdown-divider></b-dropdown-divider>
                <b-dropdown-item>
                  BTC :
                  <span class="float-right">{{ this.$store.state.auth.currentUser.stocks.btc || 0}}</span>
                </b-dropdown-item>
                <b-dropdown-item>
                  ETH :
                  <span class="float-right">{{ this.$store.state.auth.currentUser.stocks.eth  || 0 }}</span>
                </b-dropdown-item>
                <b-dropdown-item>
                  LTC :
                  <span class="float-right">{{ this.$store.state.auth.currentUser.stocks.ltc || 0 }}</span>
                </b-dropdown-item>
                <b-dropdown-divider></b-dropdown-divider>
                <a
                  class="dropdown-item text-primary text-center"
                  href="javascript: void(0);"
                >Learn more</a>
              </b-dropdown>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-xl-8">
        <div class="card">
          <div class="card-body">
            <h4 class="card-title mb-4">Candle chart for {{ transaction.crypto.toUpperCase() }}</h4>

            <div class="mt-4">
              <apexchart
                class="apex-charts"
                height="310"
                type="candlestick"
                dir="ltr"
                :series="this.$store.state.stock[this.transaction.crypto].candles"
                :options="priceCandlestickChart.chartOptions"
              ></apexchart>
            </div>
          </div>
        </div>
      </div>

      <div class="col-xl-4">
        <div class="card">
          <div class="card-body">
            <h4 class="card-title mb-4">Buy / Sell</h4>

            <div>
              <p class="text-muted mb-2">
                <i class="mdi mdi-wallet mr-1"></i> Wallet Balance
              </p>
              <h5>$ {{ this.$store.state.auth.currentUser.cash }}</h5>
            </div>

            <div class="mt-4">
              <b-tabs nav-class="bg-light rounded" pills content-class="mt-4" v-model="transaction.type">
                <b-tab
                       v-for="tType in transactionTypes"
                       :title="tType"
                       :key="tType"                       
                >
                  <h5 class="font-size-14 mb-4">{{ tType }} Coin</h5>
                  <div>
                    <div>
                      <label>Add Amount :</label>
                      <div class="input-group mb-3">
                        <div class="input-group-prepend">
                          <label class="input-group-text">Amount</label>
                        </div>
                        <select id="select_transaction" class="custom-select" style="max-width: 90px;" v-model="transaction.crypto">
                          <option value="btc" selected>BTC</option>
                          <option value="eth">ETH</option>
                          <option value="ltc">LTC</option>
                        </select>
                        <input type="number" id="amount" class="form-control" placeholder="Input here the amount"  v-model="transaction.amount"/>
                      </div>

                      <div class="input-group mb-3">
                        <div class="input-group-prepend">
                          <label class="input-group-text">Price</label>
                        </div>
                        <input type="number" class="form-control" :value="cryptoPrice" readonly/>
                        <div class="input-group-append">
                          <label class="input-group-text">$</label>
                        </div>
                      </div>

                      <div class="input-group mb-3">
                        <div class="input-group-prepend">
                          <label class="input-group-text">Total</label>
                        </div>
                        <input type="number" class="form-control" :value="totalValue" readonly/>
                      </div>
                    </div>

                    <div class="text-center">
                      <button type="button" class="btn btn-success w-md" @click="makeStockTransaction">{{ tType }} Coin</button>
                    </div>

                  </div>
                </b-tab>
              </b-tabs>
              <b-modal v-model="transactionModal.show" title="Crypto Transaction" centered hide-footer>
                <div class="text-center">
                  <b-spinner label="Spinning" v-if="transactionModal.loading == true" />
                  <div class="center-block" v-else>{{ transactionModalMsg }}</div>

                  <b-button class="mt-3" :variant="transactionModalColor" block @click="resetTransactionModal">Done</b-button>

                </div>

              </b-modal>
            </div>
          </div>
        </div>
      </div>
    </div>

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