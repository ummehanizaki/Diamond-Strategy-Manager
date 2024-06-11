interface IERC4626 {

  // Basic ERC20 functions (inherited from ERC20)
  function totalSupply() external view returns (uint256);
  function balanceOf(address account) external view returns (uint256);
  function allowance(address owner, address spender) external view returns (uint256);
  function transfer(address recipient, uint256 amount) external returns (bool);
  function approve(address spender, uint256 amount) external returns (bool);
  function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

  // ERC4626 specific functions
  event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares);
  event Withdraw(address indexed owner, uint256 shares, uint256 assets);
  event Redeem(address indexed owner, uint256 shares, uint256 assets, address indexed receiver);
  function asset() external view returns (address); // Underlying asset for the vault
  function totalAssetSupply() external view returns (uint256); // Total assets accrued in the vault (interest-bearing)
  function convertToShares(uint256 assets) external view returns (uint256); // Converts asset amount to share amount
  function convertToAssets(uint256 shares) external view returns (uint256); // Converts share amount to asset amount
  function mint(address receiver, uint256 assets) external returns (uint256 shares); // Deposits assets and mints shares
  function burn(uint256 shares, address receiver) external returns (uint256 assets); // Burns shares and withdraws assets
  function deposit(uint256 assets, address receiver) external returns (uint256 shares); // Deposits assets with optional receiver (ERC20-like)
  function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares); // Withdraws assets with optional receiver and owner
  function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets); // Redeems shares for assets with optional receiver and owner

  // Preview functions (optional)
  function previewDeposit(uint256 assets) external view returns (uint256 shares); // Simulates deposit to see minted shares
  function previewMint(uint256 shares) external view returns (uint256 assets); // Simulates mint to see required assets
  function previewWithdraw(uint256 shares) external view returns (uint256 assets); // Simulates withdrawal to see received assets
  function previewRedeem(uint256 shares) external view returns (uint256 assets); // Simulates redeem to see received assets
}