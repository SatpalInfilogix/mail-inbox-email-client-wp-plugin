export default {
  name: 'CreateOrderDialog',
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    agents: {
      type: Array,
      required: true,
    },
    products: {
      type: Array,
      required: true,
    },
    users: {
      type: Array,
      required: true,
    },
    pendingActionDetails: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      newOrder: {
        customer: null,
        agent: null,
        products: [],
        description: '',
        customerPhone: '',
        amount: 1
      },
      visibleInternal: this.visible,
      isSubmitting: false,
      rules: {
        required: (value) => !!value || 'This field is required',
        arrayRequired: (value) => (Array.isArray(value) && value.length > 0) || 'Select at least one item',
        number: (value) =>
          !isNaN(parseFloat(value)) && isFinite(value) || 'Must be a valid number',
        minAmount: (value) => value > 0 || 'Amount must be greater than 0',
        phoneNumber: (value) => String(value).length === 10 || 'Phone number must be 10 digits only',
      },
    };
  },
  watch: {
    visible(val) {
      let customerId = this.pendingActionDetails?.defaultUserId || null;
      if(customerId){
        this.newOrder.customer = this.users.find(user => user.id === customerId);
        this.updatePhoneNumberByUserId(customerId);
      }

      this.visibleInternal = val;
    },
    visibleInternal(val) {
      this.$emit('update:visible', val);
    },
    'newOrder.customer': {
      handler(customer) {
        if (customer && customer.id) {
         this.updatePhoneNumberByUserId(customer.id);
        }
      },
      deep: true,
      immediate: true 
    }
  },
  methods: {
    async handleSubmit(event) {
      if (event) event.preventDefault();

      const { valid } = await this.$refs.createOrderForm.validate()

      if (valid && !this.isSubmitting) {
        this.isSubmitting = true;

        const formdata = new FormData();
        formdata.append("action", "mail_inbox_create_order");
        formdata.append("customer_id", this.newOrder.customer.userId);
        formdata.append("agent_id", this.newOrder.agent);
        formdata.append("products", this.newOrder.products.map(item => item.id).join(', '));
        formdata.append("description", this.newOrder.description);
        formdata.append("customer_phone", this.newOrder.customerPhone);
        formdata.append("email_id", this.pendingActionDetails?.emailId || 0);
        formdata.append("amount", this.newOrder.amount);

        const response = await fetch(ajaxurl, {
          method: 'POST',
          body: formdata
        });

        const apiResponse = await response.json();
        if(apiResponse.success){
          this.isSubmitting = false;
          let response = {
            userId: this.newOrder.customer.userId,
            orderId: apiResponse.data.orderId,
            orderNumber: apiResponse.data.orderNumber,
          }

          this.resetForm();
          this.$emit('orderCreatedSuccess', response);
          this.closeDialog();
        } else {
          this.isSubmitting = false;
          alert('Something went wrong!');
        }
      }
    },
    closeDialog() {
      this.visibleInternal = false;
      this.$emit('close');
    },
    updateVisibility(val) {
      this.visibleInternal = val;
    },
    updatePhoneNumberByUserId(userId){
      const user = this.users.find(user => user.id === userId);
      if (user) {
        this.newOrder.customerPhone = Number(user.phoneNumber) || '';
      } else {
        this.newOrder.customerPhone = '';
      }
    },
    resetForm(){
      this.newOrder.customer = null;
      this.newOrder.agent = null;
      this.newOrder.products = [];
      this.newOrder.description = '';
      this.newOrder.customerPhone = '';
      this.newOrder.amount = '1';
    },
  },
  template: `
    <div>
      <v-dialog v-model="visibleInternal" persistent max-width="750px" @input="updateVisibility">
      <v-card>
        <v-card-title class="d-flex justify-space-between">
          <span class="text-h6">Create an Order</span>
          <v-icon class="text-body-1" @click="closeDialog">mdi-close</v-icon>
        </v-card-title>
        <v-card-text>
          <v-form ref="createOrderForm" @keydown.enter="handleSubmit" class="form-inputs">
            <v-row>
              <v-col sm="6">
                <v-autocomplete
                  label="Select Customer"
                  v-model="newOrder.customer"
                  :items="users"
                  item-title="name"
                  item-value="userId"
                  :rules="[rules.required]"
                  return-object
                  dense
                  outlined
                ></v-autocomplete>
              </v-col>
              <v-col sm="6">
                <v-autocomplete
                  label="Select Agent"
                  v-model="newOrder.agent"
                  :items="agents"
                  item-title="name"
                  item-value="id"
                  :rules="[rules.required]"
                  dense
                  outlined
                  hide-details
                ></v-autocomplete>
              </v-col>
              <v-col sm="6">
                <v-autocomplete
                  v-model="newOrder.products"
                  :items="products"
                  label="Products"
                  item-title="name"
                  item-value="id"
                  :rules="[rules.arrayRequired]"
                  return-object
                  multiple
                ></v-autocomplete>
              </v-col>
              <v-col sm="6">
                <v-text-field type="number" label="Customer Phone Number" v-model="newOrder.customerPhone" :rules="[rules.required, rules.number, rules.phoneNumber]"></v-text-field>
              </v-col>
              <v-col sm="6">
                <v-text-field label="Description" v-model="newOrder.description" :rules="[rules.required]"></v-text-field>
              </v-col>
              <v-col sm="6">
                <v-text-field type="number" label="Enter Amount" v-model="newOrder.amount" :rules="[rules.required, rules.number, rules.minAmount]"></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <!-- Cancel Button -->
          <v-btn color="grey" text @click="closeDialog">
            Cancel
          </v-btn>
          <!-- Confirm Delete Button -->
          <v-btn class="bg-red" @click="handleSubmit" :disabled="isSubmitting">
            Confirm
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
  `
};
