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
  RefreshCw,
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
  RotateCcw,
  Eye,
  Send
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
  originalPayment?: {
    transactionId: string;
    amount: number;
    gateway: string;
  };
}

const AdminRefunds = () => {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  
  // Refund processing
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundNotes, setRefundNotes] = useState('');
  
  // Bulk operations
  const [selectedRefunds, setSelectedRefunds] = useState<string[]>([]);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject'>('approve');

  useEffect(() => {
    loadRefunds();
  }, []);

  const loadRefunds = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(serverURL + '/api/admin/refunds');
      setRefunds(response.data);
    } catch (error) {
      console.error('Error loading refunds:', error);
      toast({
        title: "Error",
        description: "Failed to load refunds",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered refunds
  const filteredRefunds = useMemo(() => {
    let filtered = refunds;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(refund => 
        refund.userEmail.toLowerCase().includes(query) ||
        refund.reason.toLowerCase().includes(query) ||
        refund.processedBy.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(refund => refund.status === statusFilter);
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
      }
      
      if (startDate) {
        filtered = filtered.filter(refund => new Date(refund.date) >= startDate);
      }
    }

    return filtered;
  }, [refunds, searchQuery, statusFilter, dateFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredRefunds.length;
    const pending = filteredRefunds.filter(r => r.status === 'pending').length;
    const approved = filteredRefunds.filter(r => r.status === 'approved').length;
    const rejected = filteredRefunds.filter(r => r.status === 'rejected').length;
    const processed = filteredRefunds.filter(r => r.status === 'processed').length;
    
    const totalAmount = filteredRefunds
      .filter(r => r.status === 'processed')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const pendingAmount = filteredRefunds
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + r.amount, 0);
    
    return {
      total,
      pending,
      approved,
      rejected,
      processed,
      totalAmount,
      pendingAmount
    };
  }, [filteredRefunds]);

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'processed':
        return <RotateCcw className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'pending':
        return 'secondary';
      case 'processed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Process refund
  const processRefund = async () => {
    if (!selectedRefund || !refundAmount || !refundReason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await axios.post(serverURL + '/api/admin/refunds/process', {
        refundId: selectedRefund._id,
        amount: parseFloat(refundAmount),
        reason: refundReason,
        notes: refundNotes,
        status: 'approved'
      });
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Refund processed successfully",
        });
        setIsRefundDialogOpen(false);
        setRefundReason('');
        setRefundAmount('');
        setRefundNotes('');
        loadRefunds();
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

  // Bulk operations
  const handleBulkAction = async () => {
    if (selectedRefunds.length === 0) {
      toast({
        title: "Error",
        description: "Please select refunds to process",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await axios.post(serverURL + '/api/admin/refunds/bulk', {
        refundIds: selectedRefunds,
        action: bulkAction,
        notes: bulkAction === 'reject' ? 'Bulk rejected by admin' : 'Bulk approved by admin'
      });
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: `Bulk ${bulkAction} completed successfully`,
        });
        setIsBulkDialogOpen(false);
        setSelectedRefunds([]);
        loadRefunds();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${bulkAction} refunds`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refund selection
  const handleRefundSelection = (refundId: string) => {
    setSelectedRefunds(prev => 
      prev.includes(refundId) 
        ? prev.filter(id => id !== refundId)
        : [...prev, refundId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRefunds.length === filteredRefunds.length) {
      setSelectedRefunds([]);
    } else {
      setSelectedRefunds(filteredRefunds.map(r => r._id));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Refund Management</h1>
          <p className="text-muted-foreground mt-1">Process and manage customer refund requests</p>
        </div>
        <Button onClick={loadRefunds} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              ${stats.pendingAmount.toFixed(2)} pending
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processed}</div>
            <p className="text-xs text-muted-foreground">
              ${stats.totalAmount.toFixed(2)} refunded
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search refunds..."
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
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
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

      {/* Bulk Actions */}
      {selectedRefunds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Actions ({selectedRefunds.length} selected)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setBulkAction('approve');
                  setIsBulkDialogOpen(true);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve Selected
              </Button>
              <Button
                onClick={() => {
                  setBulkAction('reject');
                  setIsBulkDialogOpen(true);
                }}
                variant="destructive"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject Selected
              </Button>
              <Button
                onClick={() => setSelectedRefunds([])}
                variant="outline"
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refunds Table */}
      <Card>
        <CardHeader>
          <CardTitle>Refund Requests ({filteredRefunds.length})</CardTitle>
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
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedRefunds.length === filteredRefunds.length && filteredRefunds.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRefunds.map((refund) => (
                  <TableRow key={refund._id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedRefunds.includes(refund._id)}
                        onChange={() => handleRefundSelection(refund._id)}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{refund.userEmail}</p>
                        <p className="text-sm text-muted-foreground">
                          Processed by: {refund.processedBy || 'System'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        ${refund.amount.toFixed(2)} {refund.currency}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={refund.reason}>
                        {refund.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(refund.status)}
                        <Badge variant={getStatusBadgeVariant(refund.status)}>
                          {refund.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(refund.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {refund.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRefund(refund);
                              setRefundAmount(refund.amount.toString());
                              setRefundReason(refund.reason);
                              setIsRefundDialogOpen(true);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Process
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRefund(refund);
                            setIsRefundDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredRefunds.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <RotateCcw className="h-8 w-8 mb-2" />
                        <p>No refunds match your search criteria</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Refund Processing Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedRefund?.status === 'pending' ? 'Process Refund' : 'Refund Details'}
            </DialogTitle>
            <DialogDescription>
              {selectedRefund?.status === 'pending' 
                ? 'Review and process this refund request' 
                : 'View refund details'
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedRefund && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">User Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedRefund.userEmail}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedRefund.status)}
                    <Badge variant={getStatusBadgeVariant(selectedRefund.status)}>
                      {selectedRefund.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-sm text-muted-foreground">
                    ${selectedRefund.amount.toFixed(2)} {selectedRefund.currency}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedRefund.date).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Original Reason</Label>
                <p className="text-sm text-muted-foreground mt-1">{selectedRefund.reason}</p>
              </div>
              
              {selectedRefund.status === 'pending' && (
                <>
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
                    <Input
                      id="refundReason"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Reason for refund..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="refundNotes">Additional Notes</Label>
                    <Textarea
                      id="refundNotes"
                      value={refundNotes}
                      onChange={(e) => setRefundNotes(e.target.value)}
                      placeholder="Additional notes..."
                      rows={3}
                    />
                  </div>
                </>
              )}
              
              {selectedRefund.notes && (
                <div>
                  <Label className="text-sm font-medium">Admin Notes</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedRefund.notes}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefundDialogOpen(false)}>
              Close
            </Button>
            {selectedRefund?.status === 'pending' && (
              <Button onClick={processRefund}>
                <Send className="mr-2 h-4 w-4" />
                Process Refund
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction === 'approve' ? 'Approve Selected Refunds' : 'Reject Selected Refunds'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {bulkAction} {selectedRefunds.length} refund(s)? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkAction}
              className={bulkAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {bulkAction === 'approve' ? 'Approve All' : 'Reject All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminRefunds;
