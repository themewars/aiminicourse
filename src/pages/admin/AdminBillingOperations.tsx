import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { serverURL } from '@/constants';
import axios from 'axios';
import { toast } from '@/hooks/use-toast';
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
import {
  CreditCard,
  Download,
  Eye,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  FileText,
  Send,
  Users,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface BillingOperation {
  _id: string;
  userEmail: string;
  amount: number;
  currency: string;
  description: string;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed';
  date: string;
  processedBy: string;
  invoiceUrl?: string;
}

interface BillingAnalytics {
  period: string;
  startDate: string;
  endDate: string;
  totalRevenue: number;
  activeSubscriptions: number;
  newSubscriptions: number;
  cancelledSubscriptions: number;
  paymentSuccessRate: number;
  averageSubscriptionValue: number;
  monthlyGrowth: number;
  revenueByPlan: {
    free: number;
    monthly: number;
    yearly: number;
  };
}

const AdminBillingOperations = () => {
  const [billingOperations, setBillingOperations] = useState<BillingOperation[]>([]);
  const [analytics, setAnalytics] = useState<BillingAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('month');
  
  // Manual billing
  const [isManualBillingOpen, setIsManualBillingOpen] = useState(false);
  const [manualBillingData, setManualBillingData] = useState({
    userEmail: '',
    amount: '',
    currency: 'USD',
    description: '',
    paymentMethod: 'manual'
  });
  
  // Invoice generation
  const [selectedOperation, setSelectedOperation] = useState<BillingOperation | null>(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [dateFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load billing operations
      const operationsResponse = await axios.get(serverURL + '/api/admin/billing/operations', {
        params: { period: dateFilter }
      });
      setBillingOperations(operationsResponse.data);
      
      // Load analytics
      const analyticsResponse = await axios.get(serverURL + '/api/admin/billing/analytics', {
        params: { period: dateFilter }
      });
      if (analyticsResponse.data.success) {
        setAnalytics(analyticsResponse.data.analytics);
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

  // Filtered operations
  const filteredOperations = useMemo(() => {
    let filtered = billingOperations;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(operation => 
        operation.userEmail.toLowerCase().includes(query) ||
        operation.description.toLowerCase().includes(query) ||
        operation.paymentMethod.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(operation => operation.status === statusFilter);
    }

    return filtered;
  }, [billingOperations, searchQuery, statusFilter]);

  // Process manual billing
  const processManualBilling = async () => {
    if (!manualBillingData.userEmail || !manualBillingData.amount || !manualBillingData.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
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

  // Generate invoice
  const generateInvoice = async (operation: BillingOperation) => {
    try {
      const response = await axios.post(serverURL + '/api/admin/invoices/generate', {
        operationId: operation._id,
        type: 'manual_billing'
      });
      
      if (response.data.success) {
        // Download invoice
        const link = document.createElement('a');
        link.href = response.data.invoiceUrl;
        link.download = `invoice-${operation._id}.pdf`;
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

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing Operations</h1>
          <p className="text-muted-foreground mt-1">Manual billing, invoice generation, and billing analytics</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setIsManualBillingOpen(true)}>
            <CreditCard className="mr-2 h-4 w-4" />
            Manual Billing
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.monthlyGrowth >= 0 ? '+' : ''}{analytics.monthlyGrowth.toFixed(1)}% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.activeSubscriptions}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.newSubscriptions} new this month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.paymentSuccessRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Payment success rate
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Subscription</CardTitle>
              <PieChart className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.averageSubscriptionValue)}</div>
              <p className="text-xs text-muted-foreground">
                Average monthly value
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue by Plan Chart */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Plan Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(analytics.revenueByPlan.free)}
                </div>
                <p className="text-sm text-blue-600">Free Plan</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(analytics.revenueByPlan.monthly)}
                </div>
                <p className="text-sm text-green-600">Monthly Plan</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(analytics.revenueByPlan.yearly)}
                </div>
                <p className="text-sm text-purple-600">Yearly Plan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search operations..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="date">Period</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Operations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Operations ({filteredOperations.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOperations.map((operation) => (
                  <TableRow key={operation._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{operation.userEmail}</p>
                        <p className="text-sm text-muted-foreground">
                          Processed by: {operation.processedBy || 'System'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatCurrency(operation.amount, operation.currency)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={operation.description}>
                        {operation.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(operation.status)}
                        <Badge variant={getStatusBadgeVariant(operation.status)}>
                          {operation.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {operation.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(operation.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateInvoice(operation)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Invoice
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOperation(operation);
                            setIsInvoiceDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredOperations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <CreditCard className="h-8 w-8 mb-2" />
                        <p>No billing operations match your search criteria</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Manual Billing Dialog */}
      <Dialog open={isManualBillingOpen} onOpenChange={setIsManualBillingOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Manual Billing</DialogTitle>
            <DialogDescription>
              Create a manual billing entry for a user
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="userEmail">User Email *</Label>
              <Input
                id="userEmail"
                type="email"
                value={manualBillingData.userEmail}
                onChange={(e) => setManualBillingData({...manualBillingData, userEmail: e.target.value})}
                placeholder="user@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
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
                  <SelectItem value="INR">INR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={manualBillingData.description}
                onChange={(e) => setManualBillingData({...manualBillingData, description: e.target.value})}
                placeholder="Description of the billing..."
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={manualBillingData.paymentMethod}
                onValueChange={(value) => setManualBillingData({...manualBillingData, paymentMethod: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Entry</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManualBillingOpen(false)}>
              Cancel
            </Button>
            <Button onClick={processManualBilling}>
              <Send className="mr-2 h-4 w-4" />
              Process Billing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Operation Details Dialog */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Billing Operation Details</DialogTitle>
            <DialogDescription>
              Detailed information about this billing operation
            </DialogDescription>
          </DialogHeader>
          
          {selectedOperation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">User Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedOperation.userEmail}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedOperation.status)}
                    <Badge variant={getStatusBadgeVariant(selectedOperation.status)}>
                      {selectedOperation.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(selectedOperation.amount, selectedOperation.currency)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <p className="text-sm text-muted-foreground capitalize">{selectedOperation.paymentMethod}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedOperation.date).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Processed By</Label>
                  <p className="text-sm text-muted-foreground">{selectedOperation.processedBy || 'System'}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-muted-foreground mt-1">{selectedOperation.description}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInvoiceDialogOpen(false)}>
              Close
            </Button>
            {selectedOperation && (
              <Button onClick={() => generateInvoice(selectedOperation)}>
                <Download className="mr-2 h-4 w-4" />
                Generate Invoice
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBillingOperations;
