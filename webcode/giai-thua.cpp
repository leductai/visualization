#include <iostream>
using namespace std;

// Giam de tri top-down: n! = n * (n-1)!
long long giaithua(int n) {
    if (n == 0) return 1;
    return n * giaithua(n - 1);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    cout << giaithua(n) << '\n';
    return 0;
}
