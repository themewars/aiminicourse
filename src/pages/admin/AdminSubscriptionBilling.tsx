
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { serverURL } from '@/constants';
import axios from 'axios';
import { toast } from '@/hooks/use-toast';
import { MinimalTiptapEditor } from '../../minimal-tiptap';
import { Content } from '@tiptap/react';
import { 
  Save, 
  CreditCard, 
  Users, 
  DollarSign, 
  RefreshCw, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Download,
  Send,
  Search,
  Filter
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Subscription {
  _id: string;
  user: string;
  userEmail: string;
  userName: string;
  plan: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  nextBillingDate: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  lastPaymentDate: string;
  autoRenew: boolean;
}

interface Payment {
  _id: string;
  user: string;
  userEmail: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'pending' | 'refunded';
  paymentMethod: string;
  transactionId: string;
  date: string;
  gateway: string;
}

interface Refund {
  _id: string;
  user: string;
  userEmail: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  date: string;
  processedBy: string;
  notes: string;
}

const AdminSubscriptionBilling = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [billingPolicy, setBillingPolicy] = useState<Content>('');
  
  // Subscription Management
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [subscriptionAction, setSubscriptionAction] = useState<'edit' | 'cancel' | 'renew'>('edit');
  
  // Payment Processing
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  
  // Refund System
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  
  // Manual Billing
  const [isManualBillingOpen, setIsManualBillingOpen] = useState(false);
  const [manualBillingData, setManualBillingData] = useState({
    userEmail: '',
    amount: '',
    currency: 'USD',
    description: '',
    paymentMethod: 'manual'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load subscriptions
      const subscriptionsResponse = await axios.get(serverURL + '/api/admin/subscriptions');
      setSubscriptions(subscriptionsResponse.data);
      
      // Load payments
      const paymentsResponse = await axios.get(serverURL + '/api/admin/payments');
      setPayments(paymentsResponse.data);
      
      // Load refunds
      const refundsResponse = await axios.get(serverURL + '/api/admin/refunds');
      setRefunds(refundsResponse.data);
      
      // Load billing policy
      const policyResponse = await axios.get(serverURL + '/api/policies');
      if (policyResponse.data && policyResponse.data[0]) {
        setBillingPolicy(policyResponse.data[0].billing || '');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load billing data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save billing policy
  const saveBillingPolicy = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(serverURL + '/api/saveadmin', {
        data: billingPolicy,
        type: 'billing'
      });
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Billing policy saved successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save billing policy",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save billing policy",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Subscription Management Functions
  const handleSubscriptionAction = async () => {
    if (!selectedSubscription) return;
    
    setIsLoading(true);
    try {
      let response;
      
      switch (subscriptionAction) {
        case 'edit':
          response = await axios.post(serverURL + '/api/admin/subscriptions/update', {
            subscriptionId: selectedSubscription._id,
            updates: selectedSubscription
          });
          break;
        case 'cancel':
          response = await axios.post(serverURL + '/api/admin/subscriptions/cancel', {
            subscriptionId: selectedSubscription._id
          });
          break;
        case 'renew':
          response = await axios.post(serverURL + '/api/admin/subscriptions/renew', {
            subscriptionId: selectedSubscription._id
          });
          break;
      }
      
      if (response?.data.success) {
        toast({
          title: "Success",
          description: `Subscription ${subscriptionAction}ed successfully`,
        });
        setIsSubscriptionDialogOpen(false);
        loadData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${subscriptionAction} subscription`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Refund Processing
  const processRefund = async () => {
    if (!selectedRefund || !refundAmount || !refundReason) return;
    
    setIsLoading(true);
    try {
      const response = await axios.post(serverURL + '/api/admin/refunds/process', {
        refundId: selectedRefund._id,
        amount: parseFloat(refundAmount),
        reason: refundReason,
        status: 'approved'
      });
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Refund processed successfully",
        });
        setIsRefundDialogOpen(false);
        loadData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process refund",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Manual Billing
  const processManualBilling = async () => {
    if (!manualBillingData.userEmail || !manualBillingData.amount) return;
    
    setIsLoading(true);
    try {
      const response = await axios.post(serverURL + '/api/admin/billing/manual', {
        userEmail: manualBillingData.userEmail,
        amount: parseFloat(manualBillingData.amount),
        currency: manualBillingData.currency,
        description: manualBillingData.description,
        paymentMethod: manualBillingData.paymentMethod
      });
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Manual billing processed successfully",
        });
        setIsManualBillingOpen(false);
        setManualBillingData({
          userEmail: '',
          amount: '',
          currency: 'USD',
          description: '',
          paymentMethod: 'manual'
        });
        loadData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process manual billing",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Invoice
  const generateInvoice = async (payment: Payment) => {
    try {
      const response = await axios.post(serverURL + '/api/admin/invoices/generate', {
        paymentId: payment._id
      });
      
      if (response.data.success) {
        // Download invoice
        const link = document.createElement('a');
        link.href = response.data.invoiceUrl;
        link.download = `invoice-${payment.transactionId}.pdf`;
        link.click();
        
        toast({
          title: "Success",
          description: "Invoice generated and downloaded",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate invoice",
        variant: "destructive",
      });
    }
  };

  // Calculate statistics
  const stats = {
    totalSubscriptions: subscriptions.length,
    activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
    totalRevenue: payments.filter(p => p.status === 'success').reduce((sum, p) => sum + p.amount, 0),
    pendingRefunds: refunds.filter(r => r.status === 'pending').length,
    failedPayments: payments.filter(p => p.status === 'failed').length
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription & Billing Management</h1>
          <p className="text-muted-foreground mt-1">Manage subscriptions, payments, refunds, and billing operations</p>
        </div>
        <Button onClick={saveBillingPolicy} disabled={isLoading}>
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? 'Saving...' : 'Save Policy'}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscriptions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Refunds</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRefunds}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedPayments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="policy">Policy</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Subscriptions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Recent Subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {subscriptions.slice(0, 5).map((sub) => (
                    <div key={sub._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{sub.userName}</p>
                        <p className="text-sm text-muted-foreground">{sub.plan}</p>
                      </div>
                      <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                        {sub.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Payments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Recent Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payments.slice(0, 5).map((payment) => (
                    <div key={payment._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">${payment.amount}</p>
                        <p className="text-sm text-muted-foreground">{payment.userEmail}</p>
                      </div>
                      <Badge variant={payment.status === 'success' ? 'default' : 'destructive'}>
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Subscription Management</h3>
            <Button onClick={() => setActiveTab('billing')}>
              <CreditCard className="mr-2 h-4 w-4" />
              Manual Billing
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Next Billing</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <TableRow key={sub._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sub.userName}</p>
                          <p className="text-sm text-muted-foreground">{sub.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{sub.plan}</TableCell>
                      <TableCell>
                        <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell>${sub.amount} {sub.currency}</TableCell>
                      <TableCell>{new Date(sub.nextBillingDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSubscription(sub);
                              setSubscriptionAction('edit');
                              setIsSubscriptionDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSubscription(sub);
                              setSubscriptionAction('cancel');
                              setIsSubscriptionDialogOpen(true);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <h3 className="text-lg font-semibold">Payment History</h3>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell>{payment.userEmail}</TableCell>
                      <TableCell>${payment.amount} {payment.currency}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === 'success' ? 'default' : 'destructive'}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{payment.paymentMethod}</TableCell>
                      <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateInvoice(payment)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Invoice
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Refunds Tab */}
        <TabsContent value="refunds" className="space-y-4">
          <h3 className="text-lg font-semibold">Refund Management</h3>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refunds.map((refund) => (
                    <TableRow key={refund._id}>
                      <TableCell>{refund.userEmail}</TableCell>
                      <TableCell>${refund.amount} {refund.currency}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{refund.reason}</TableCell>
                      <TableCell>
                        <Badge variant={
                          refund.status === 'approved' ? 'default' : 
                          refund.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {refund.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(refund.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {refund.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRefund(refund);
                              setRefundAmount(refund.amount.toString());
                              setIsRefundDialogOpen(true);
                            }}
                          >
                            Process
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4">
          <h3 className="text-lg font-semibold">Billing Operations</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Manual Billing */}
            <Card>
              <CardHeader>
                <CardTitle>Manual Billing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="userEmail">User Email</Label>
                  <Input
                    id="userEmail"
                    value={manualBillingData.userEmail}
                    onChange={(e) => setManualBillingData({...manualBillingData, userEmail: e.target.value})}
                    placeholder="user@example.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={manualBillingData.amount}
                    onChange={(e) => setManualBillingData({...manualBillingData, amount: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={manualBillingData.currency}
                    onValueChange={(value) => setManualBillingData({...manualBillingData, currency: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={manualBillingData.description}
                    onChange={(e) => setManualBillingData({...manualBillingData, description: e.target.value})}
                    placeholder="Billing description..."
                  />
                </div>
                
                <Button onClick={processManualBilling} className="w-full">
                  Process Manual Billing
                </Button>
              </CardContent>
            </Card>

            {/* Billing Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Billing Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Monthly Revenue</span>
                  <span className="font-bold">${stats.totalRevenue.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Active Subscriptions</span>
                  <span className="font-bold">{stats.activeSubscriptions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Payment Success Rate</span>
                  <span className="font-bold">
                    {payments.length > 0 ? 
                      ((payments.filter(p => p.status === 'success').length / payments.length) * 100).toFixed(1) + '%' : 
                      '0%'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Policy Tab */}
        <TabsContent value="policy" className="space-y-4">
          <h3 className="text-lg font-semibold">Billing Policy Management</h3>
          
          <Card>
            <CardHeader>
              <CardTitle>Edit Billing Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <MinimalTiptapEditor
                value={billingPolicy}
                onChange={setBillingPolicy}
                className="w-full"
                editorContentClassName="p-5"
                output="html"
                placeholder="Start writing your billing policy..."
                autofocus={true}
                editable={true}
                editorClassName="focus:outline-none"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Subscription Action Dialog */}
      <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {subscriptionAction === 'edit' ? 'Edit Subscription' :
               subscriptionAction === 'cancel' ? 'Cancel Subscription' :
               'Renew Subscription'}
            </DialogTitle>
            <DialogDescription>
              {subscriptionAction === 'edit' ? 'Modify subscription details' :
               subscriptionAction === 'cancel' ? 'Cancel this subscription' :
               'Renew this subscription'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubscription && (
            <div className="space-y-4">
              {subscriptionAction === 'edit' && (
                <>
                  <div>
                    <Label htmlFor="plan">Plan</Label>
                    <Select
                      value={selectedSubscription.plan}
                      onValueChange={(value) => setSelectedSubscription({...selectedSubscription, plan: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Free Plan">Free Plan</SelectItem>
                        <SelectItem value="Monthly Plan">Monthly Plan</SelectItem>
                        <SelectItem value="Yearly Plan">Yearly Plan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={selectedSubscription.status}
                      onValueChange={(value: 'active' | 'cancelled' | 'expired' | 'pending') => 
                        setSelectedSubscription({...selectedSubscription, status: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              {subscriptionAction === 'cancel' && (
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <p>Are you sure you want to cancel this subscription?</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    User: {selectedSubscription.userName} ({selectedSubscription.userEmail})
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubscriptionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubscriptionAction}>
              {subscriptionAction === 'edit' ? 'Save Changes' :
               subscriptionAction === 'cancel' ? 'Cancel Subscription' :
               'Renew Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Processing Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Process refund for {selectedRefund?.userEmail}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="refundAmount">Refund Amount</Label>
              <Input
                id="refundAmount"
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="refundReason">Refund Reason</Label>
              <Textarea
                id="refundReason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Reason for refund..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefundDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={processRefund}>
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubscriptionBilling;
