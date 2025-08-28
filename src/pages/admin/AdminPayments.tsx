import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Settings
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  metadata?: {
    description?: string;
    plan?: string;
    userId?: string;
  };
}

interface PaymentStats {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  refunded: number;
  totalAmount: number;
  successRate: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
}

const ITEMS_PER_PAGE = 20;

const AdminPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gatewayFilter, setGatewayFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isPaymentDetailOpen, setIsPaymentDetailOpen] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Load payments with pagination
  const loadPayments = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${serverURL}/api/admin/payments`, {
        params: {
          page,
          limit: ITEMS_PER_PAGE,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          gateway: gatewayFilter !== 'all' ? gatewayFilter : undefined,
          search: searchQuery || undefined,
          dateFilter: dateFilter !== 'all' ? dateFilter : undefined
        }
      });
      
      if (response.data.success === false) {
        throw new Error(response.data.message || 'Failed to load payments');
      }
      
      setPayments(response.data.payments || response.data);
      setTotalPages(Math.ceil((response.data.total || response.data.length) / ITEMS_PER_PAGE));
      setCurrentPage(page);
    } catch (error: any) {
      console.error('Error loading payments:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load payments';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, gatewayFilter, searchQuery, dateFilter]);

  useEffect(() => {
    loadPayments(1);
  }, [loadPayments]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, gatewayFilter, searchQuery, dateFilter]);

  // Filtered payments for current page
  const filteredPayments = useMemo(() => {
    let filtered = payments;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(payment => 
        payment.userEmail.toLowerCase().includes(query) ||
        payment.transactionId.toLowerCase().includes(query) ||
        payment.gateway.toLowerCase().includes(query) ||
        (payment.metadata?.plan && payment.metadata.plan.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    // Gateway filter
    if (gatewayFilter !== 'all') {
      filtered = filtered.filter(payment => payment.gateway === gatewayFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        filtered = filtered.filter(payment => new Date(payment.date) >= startDate);
      }
    }

    return filtered;
  }, [payments, searchQuery, statusFilter, gatewayFilter, dateFilter]);

  // Calculate statistics
  const stats = useMemo((): PaymentStats => {
    const total = filteredPayments.length;
    const successful = filteredPayments.filter(p => p.status === 'success').length;
    const failed = filteredPayments.filter(p => p.status === 'failed').length;
    const pending = filteredPayments.filter(p => p.status === 'pending').length;
    const refunded = filteredPayments.filter(p => p.status === 'refunded').length;
    
    const totalAmount = filteredPayments
      .filter(p => p.status === 'success')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const successRate = total > 0 ? (successful / total) * 100 : 0;
    
    // Calculate monthly and weekly revenue
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const monthlyRevenue = filteredPayments
      .filter(p => p.status === 'success' && new Date(p.date) >= monthStart)
      .reduce((sum, p) => sum + p.amount, 0);
    
    const weeklyRevenue = filteredPayments
      .filter(p => p.status === 'success' && new Date(p.date) >= weekStart)
      .reduce((sum, p) => sum + p.amount, 0);
    
    return {
      total,
      successful,
      failed,
      pending,
      refunded,
      totalAmount,
      successRate,
      monthlyRevenue,
      weeklyRevenue
    };
  }, [filteredPayments]);

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'refunded':
        return <AlertTriangle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'success':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'pending':
        return 'secondary';
      case 'refunded':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Generate invoice
  const generateInvoice = async (payment: Payment) => {
    setIsActionLoading(true);
    try {
      const response = await axios.post(`${serverURL}/api/admin/invoices/generate`, {
        paymentId: payment._id
      });
      
      if (response.data.success) {
        // Download invoice
        const link = document.createElement('a');
        link.href = response.data.invoiceUrl;
        link.download = `invoice-${payment.transactionId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Success",
          description: "Invoice generated and downloaded",
        });
      } else {
        throw new Error(response.data.message || 'Failed to generate invoice');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate invoice';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Export payments to CSV
  const exportToCSV = () => {
    const headers = ['Transaction ID', 'User Email', 'Amount', 'Currency', 'Status', 'Gateway', 'Date', 'Plan'];
    const csvContent = [
      headers.join(','),
      ...filteredPayments.map(payment => [
        payment.transactionId,
        payment.userEmail,
        payment.amount,
        payment.currency,
        payment.status,
        payment.gateway,
        new Date(payment.date).toLocaleDateString(),
        payment.metadata?.plan || 'Unknown'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Payments exported to CSV",
    });
  };

  // Bulk operations
  const handleBulkAction = async (action: 'delete' | 'export') => {
    if (selectedPayments.size === 0) {
      toast({
        title: "Warning",
        description: "Please select payments first",
        variant: "destructive",
      });
      return;
    }

    if (action === 'export') {
      const selectedPaymentData = payments.filter(p => selectedPayments.has(p._id));
      // Export only selected payments
      const headers = ['Transaction ID', 'User Email', 'Amount', 'Currency', 'Status', 'Gateway', 'Date', 'Plan'];
      const csvContent = [
        headers.join(','),
        ...selectedPaymentData.map(payment => [
          payment.transactionId,
          payment.userEmail,
          payment.amount,
          payment.currency,
          payment.status,
          payment.gateway,
          new Date(payment.date).toLocaleDateString(),
          payment.metadata?.plan || 'Unknown'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `selected-payments-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Selected payments exported to CSV",
      });
      setSelectedPayments(new Set());
    }
  };

  // Handle payment selection
  const handlePaymentSelection = (paymentId: string, checked: boolean) => {
    const newSelected = new Set(selectedPayments);
    if (checked) {
      newSelected.add(paymentId);
    } else {
      newSelected.delete(paymentId);
    }
    setSelectedPayments(newSelected);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPayments(new Set(filteredPayments.map(p => p._id)));
    } else {
      setSelectedPayments(new Set());
    }
  };

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      loadPayments(page);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setGatewayFilter('all');
    setDateFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Management</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage all payment transactions</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowFilters(!showFilters)} 
            variant="outline"
            size="sm"
          >
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
          <Button onClick={() => loadPayments(1)} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <p className="font-medium">Error: {error}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setError(null)}
                className="ml-auto h-6 px-2 text-red-700 hover:bg-red-100"
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.successful} successful, {stats.failed} failed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.successful} of {stats.total} payments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              ${stats.monthlyRevenue.toFixed(2)} this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Revenue</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.weeklyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Filters</span>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search payments..."
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
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="gateway">Gateway</Label>
                <Select value={gatewayFilter} onValueChange={setGatewayFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Gateways" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Gateways</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="razorpay">Razorpay</SelectItem>
                    <SelectItem value="paystack">Paystack</SelectItem>
                    <SelectItem value="flutterwave">Flutterwave</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="date">Date Range</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {selectedPayments.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  {selectedPayments.size} payment(s) selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('export')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedPayments(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment Transactions ({filteredPayments.length})</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={exportToCSV}
                disabled={filteredPayments.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export All
              </Button>
            </div>
          </div>
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
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedPayments.size === filteredPayments.length && filteredPayments.length > 0}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Gateway</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPayments.has(payment._id)}
                          onCheckedChange={(checked) => handlePaymentSelection(payment._id, checked as boolean)}
                          aria-label={`Select payment ${payment.transactionId}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.userEmail}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.metadata?.plan || 'Unknown Plan'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          ${payment.amount.toFixed(2)} {payment.currency}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payment.status)}
                          <Badge variant={getStatusBadgeVariant(payment.status)}>
                            {payment.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {payment.gateway}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(payment.date).toLocaleDateString()}</div>
                          <div className="text-muted-foreground">
                            {new Date(payment.date).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedPayment(payment);
                                setIsPaymentDetailOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => generateInvoice(payment)}
                              disabled={isActionLoading}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Generate Invoice
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {filteredPayments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <CreditCard className="h-8 w-8 mb-2" />
                          <p>No payments match your search criteria</p>
                          {searchQuery || statusFilter !== 'all' || gatewayFilter !== 'all' || dateFilter !== 'all' ? (
                            <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
                              Clear Filters
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredPayments.length)} of {filteredPayments.length} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Detail Dialog */}
      <Dialog open={isPaymentDetailOpen} onOpenChange={setIsPaymentDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Detailed information about this payment transaction
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Transaction ID</Label>
                  <p className="text-sm text-muted-foreground font-mono">{selectedPayment.transactionId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedPayment.status)}
                    <Badge variant={getStatusBadgeVariant(selectedPayment.status)}>
                      {selectedPayment.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-sm text-muted-foreground">
                    ${selectedPayment.amount.toFixed(2)} {selectedPayment.currency}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Gateway</Label>
                  <p className="text-sm text-muted-foreground capitalize">{selectedPayment.gateway}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">User Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedPayment.userEmail}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <p className="text-sm text-muted-foreground">{selectedPayment.paymentMethod}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedPayment.date).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Plan</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedPayment.metadata?.plan || 'Unknown'}
                  </p>
                </div>
              </div>
              
              {selectedPayment.metadata?.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedPayment.metadata.description}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDetailOpen(false)}>
              Close
            </Button>
            {selectedPayment && (
              <Button 
                onClick={() => generateInvoice(selectedPayment)}
                disabled={isActionLoading}
              >
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

export default AdminPayments;
